# Design: Buscador de Películas

## Technical Approach

Server-side search page que sigue el patrón exacto de `[cine]/index.astro`: SSR page que fetches el JSON de la API interna, filtra localmente, y renderiza con componentes Astro. `MovieCard.astro` se extrae de `NowPlaying.astro` como componente compartido. Navbar obtiene el cine desde `Astro.url.pathname` con fallback a cookie → default `"huajuapan"`.

## Architecture

```
User form submit (GET /{cine}/buscar?q=...)
        │
        ▼
  [cine]/buscar.astro  (SSR, prerender=false)
        │
        ├── Lee q de Astro.url.searchParams
        ├── Lee cine de Astro.params
        ├── fetch(`${origin}/api/peliculas/${cine}.json`)
        │
        ▼
  searchMovies(movies, q)  ──►  src/lib/utils.ts
        │
        ├── Filtra por title, genre, director, actors
        │   (case-insensitive, partial match)
        └── Ordena: matches en title primero
        │
        ▼
  Renderiza con <MovieCard />  o  empty state
```

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Búsqueda server-side vs client-side | SSR (server) | Client-side filter | Coherente con SSR existente; cero JS extra; View Transitions nativas |
| searchMovies() ubicación | `src/lib/utils.ts` | Archivo separado `search.ts` | Ya existe `utils.ts` con utilidades de movies; función pura de 20 líneas no justifica file separado |
| Cine resolution en Navbar | Server: `Astro.url` → cookie → `"huajuapan"` | Hidden input con JS | SSR puede leer `Astro.url.pathname` y `Astro.request.headers`; cookie es server-accessible |
| MovieCard scope | Solo `<article>` (sin `<swiper-slide>`) | Card con wrapper incluido | buscar.astro renderiza en grid, no en swiper; swiper-slide es concern de NowPlaying |
| transition:name | `poster-{id}`, `title-{id}` | Otros names | DEBE coincidir exactamente con `[peli].astro` líneas 56 y 60 |
| Filtrado actors | Split por coma + trim + every | Regex complejo | El campo `actors` es "Name1, Name2" simple; split + trim cubre todos los casos |

## Data Flow

```
1. User escribe "avengers" en Navbar input → Enter
2. Form GET → /huajuapan/buscar?q=avengers
3. [cine]/buscar.astro SSR:
   a. Astro.params.cine = "huajuapan"
   b. Astro.url.searchParams.get("q") = "avengers"
   c. fetch(API) → movies[]
   d. searchMovies(movies, "avengers") → filtered[]
   e. Render: <MovieCard /> por cada movie
4. User click en poster → /huajuapan/avengers-01
   View Transition anima poster y title (transition:name)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/[cine]/buscar.astro` | **Create** | SSR page: params.cine + searchParams.q → fetch → filter → render |
| `src/components/MovieCard.astro` | **Create** | Componente `<article>` con props `{ movie: Movie, cine: string }` |
| `src/components/NowPlaying.astro` | **Modify** | Import MovieCard, reemplazar template inline, mantener swiper wrapper |
| `src/components/Navbar.astro` | **Modify** | Agregar `action` + `method="GET"` + `name="q"` a ambos forms; resolver cine |
| `src/lib/utils.ts` | **Modify** | Agregar `searchMovies(movies: Movie[], query: string): Movie[]` |
| `src/lib/__tests__/search.test.ts` | **Create** | Unit tests para searchMovies (vía search.test.ts o utils.test.ts) |
| `src/components/__tests__/MovieCard.test.tsx` | **Create** | Component tests para MovieCard |

## Interfaces

```typescript
// src/lib/utils.ts — nueva función
export function searchMovies(movies: Movie[], query: string): Movie[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const matchesTitle: Movie[] = [];
  const matchesOther: Movie[] = [];

  for (const movie of movies) {
    const inTitle = movie.title.toLowerCase().includes(q);
    const inGenre = movie.genre?.toLowerCase().includes(q) ?? false;
    const inDirector = movie.director?.toLowerCase().includes(q) ?? false;
    const inActors = (movie.actors ?? '')
      .split(',')
      .some((a: string) => a.trim().toLowerCase().includes(q));

    if (inTitle || inGenre || inDirector || inActors) {
      (inTitle ? matchesTitle : matchesOther).push(movie);
    }
  }

  return [...matchesTitle, ...matchesOther];
}

// MovieCard.astro props (implícito via Astro.props)
type Props = { movie: Movie; cine: string };
```

## Cine Resolution in Navbar

```astro
---
// src/components/Navbar.astro frontmatter
import { getCookie } from 'astro/cookies';  // o manual

const pathCine = Astro.url.pathname.split('/')[1] ?? '';
const cookieCine = Astro.cookies.get('selectedCine')?.value ?? '';
const cine = pathCine || cookieCine || 'huajuapan';
---
<form action={`/${cine}/buscar`} method="GET" role="search">
  <input type="text" name="q" placeholder="Buscar películas..." />
  ...
</form>
```

## Route Design

```
GET /:cine/buscar?q=:query

Params:
  - cine: string (from URL path)
  - q: string (from searchParams, optional)

Behavior:
  - Sin q → prompt: "Escribe un término para buscar"
  - q sin results → "No se encontraron películas para '{q}'"
  - q con results → grid de MovieCard

View Transitions: same transition:name como NowPlaying
  - poster-{id} en img
  - title-{id} en title link
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | searchMovies() | Match por title/genre/director/actors; CI; empty q; special chars; ordering (title first) |
| Unit | Edge cases | Actors split/trim; null fields; empty movies array |
| Component | MovieCard | Render con mock; links contienen cine; transition:name en img y title; PosterFavoriteButton presente |
| Component | buscar.astro | Render results vs empty vs no-query prompt |
| E2E | Full flow | Navbar search → enter → results page → click movie → detail page |

## Implementation Order

1. **`searchMovies()`** en `src/lib/utils.ts` + tests (pure function, no deps)
2. **`MovieCard.astro`** + tests (componente independiente)
3. **Modificar `NowPlaying.astro`** (usar MovieCard, verificar que tests existentes pasan)
4. **`[cine]/buscar.astro`** (SSR page, reusa MovieCard)
5. **Modificar `Navbar.astro`** (forms con action + name)
6. **E2E test** (flujo completo)

## Open Questions

- [ ] ¿El Navbar necesita el cine también para enlaces de "Favoritos" y "Cartelera"? No, solo los forms de búsqueda. Los enlaces existentes no usan cine.
- [ ] Confirmar nombre del test file: spec dice `src/lib/__tests__/search.test.ts`. Precedente: `utils.test.ts` existe. Puede ser archivo separado o agregar describe block en utils.test.ts.
