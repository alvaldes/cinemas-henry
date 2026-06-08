# SDD Proposal: Buscador de Películas

## Problem Statement

El Navbar tiene input de búsqueda con placeholder "Buscar películas..." en desktop y mobile,
pero los formularios no tienen `action` ni `name` en los inputs — el usuario escribe, presiona
Enter, y no pasa nada. La funcionalidad de búsqueda no existe.

## Intent

Implementar búsqueda server-side de películas con navegación a página de resultados SSR,
siguiendo el patrón existente de `[cine]/index.astro`. Extraer `MovieCard` como componente
compartido entre NowPlaying y resultados.

## Scope

### In Scope
- `src/pages/[cine]/buscar.astro` — página SSR que recibe `?q=`, filtra movies localmente
- `src/components/Navbar.astro` — ambos forms (desktop + mobile) con `action` y `name="q"`
- `src/components/MovieCard.astro` — card extraído, compartido con NowPlaying
- `src/components/NowPlaying.astro` — refactor para usar MovieCard
- Búsqueda en: **title, genre, director, actors** (case-insensitive)
- Empty state textual cuando no hay resultados
- View Transitions (`transition:name`) en posters y títulos
- Tests: unit (search logic), component (MovieCard), E2E (flujo completo)

### Out of Scope
- Búsqueda client-side / filtro instantáneo — todo SSR
- Autocomplete / suggestions en el input
- Búsqueda cruzada entre cines
- Paginación de resultados
- Filtros adicionales (fecha, clasificación, precio)

## Capabilities

### New Capabilities
- `movie-search`: Búsqueda de películas por texto libre sobre `title`, `genre`, `director`,
  `actors` con resultados SSR, empty state, y View Transitions desde/hacia `[peli].astro`.

### Modified Capabilities
None — capability nueva, no modifica specs existentes.

## Approach

Server-side search (mismo patrón que `[cine]/index.astro`):

1. **`[cine]/buscar.astro`**: SSR page que lee `?q=`, fetches movies desde el API endpoint
   (`/api/peliculas/{cine}.json`), filtra localmente con `String.includes()` case-insensitive
   sobre los 4 campos, renderiza resultados con `MovieCard` o empty state.
2. **`Navbar.astro`**: Ambos forms obtienen `action="/{cine}/buscar"` (el cine se resuelve
   desde `Astro.url.pathname` mediante hidden input o dataset) y `name="q"` en el input.
3. **`MovieCard.astro`**: Extrae el `swiper-slide > article` de `NowPlaying.astro` como
   componente standalone que recibe `{ movie, cine }`. Mantiene `transition:name` en
   poster y título. NowPlaying lo importa y usa en el `movies.map()`.
4. **View Transitions**: Coincidir `transition:name={`poster-${movie.id}`}` y
   `transition:name={`title-${movie.id}`}` con `[peli].astro` para animación fluida.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/[cine]/buscar.astro` | New | Página SSR de resultados de búsqueda |
| `src/components/Navbar.astro` | Modified | Forms con `action` dinámico + `name="q"` |
| `src/components/MovieCard.astro` | New | Card reutilizable extraído de NowPlaying |
| `src/components/NowPlaying.astro` | Modified | Refactor para usar `MovieCard` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cine no disponible desde form submit tras View Transition | Medium | Hidden input con cine renderizado desde Astro; el cine está en `Astro.url.pathname` al SSR |
| Falsos positivos en búsqueda por `actors` (string comma-separated) | Low | Split por coma, trim, match individual por token |
| Flicker en View Transitions entre buscar.astro y [peli].astro | Low | Usar exactamente los mismos `transition:name` que NowPlaying |

## Rollback Plan

Revert commits de `Navbar.astro` y `NowPlaying.astro`; eliminar `buscar.astro` y
`MovieCard.astro`. El cambio es 100% aditivo — no rompe rutas existentes.

## Dependencies

Ninguna.

## Success Criteria

- [ ] Formularios de búsqueda (desktop + mobile) navegan a `/{cine}/buscar?q={término}`
- [ ] Resultados SSR incluyen movies cuyo `title`, `genre`, `director` o `actors` contienen `q`
- [ ] Empty state "No se encontraron películas" se muestra cuando no hay matches
- [ ] `MovieCard` renderiza idéntico en `NowPlaying` y `buscar.astro`
- [ ] `transition:name` en posters y títulos funciona entre buscar y detalle
- [ ] Tests unitarios + componente + E2E pasan (`bun test`)
