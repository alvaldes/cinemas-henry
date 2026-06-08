# Tasks: Buscador de Películas

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~315 (7 files, 3 new + 4 modified) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | searchMovies() + tests → MovieCard + tests → NowPlaying refactor → buscar.astro → Navbar → E2E | Single PR | <400 lines, no split needed |

## Phase 1: Foundation — searchMovies()

- [ ] 1.1 RED: Write failing unit tests for `searchMovies()` in `src/lib/__tests__/search.test.ts`
- [ ] 1.2 GREEN: Add `searchMovies(movies, q): Movie[]` to `src/lib/utils.ts` — CI match on title, genre, director, actors; title-first ordering; empty q → []; actors split by comma + trim

## Phase 2: Components — MovieCard

- [ ] 2.1 RED: Write failing component tests for `MovieCard` in `src/components/__tests__/MovieCard.test.tsx`
- [ ] 2.2 GREEN: Create `src/components/MovieCard.astro` — props `{ movie, cine }`, poster with hover overlay, PosterFavoriteButton, duration badge, title link, Calendario button, `transition:name={`poster-${id}`}` on img, `transition:name={`title-${id}`}` on title link
- [ ] 2.3 REFACTOR: Update `src/components/NowPlaying.astro` — import `MovieCard`, replace inline article with `<MovieCard>`, keep swiper-container/swiper-slide wrapper

## Phase 3: Pages — buscar.astro

- [ ] 3.1 Create `src/pages/[cine]/buscar.astro` — SSR page: read `q` from `Astro.url.searchParams`, cine from `Astro.params`, fetch API JSON, call `searchMovies()`, render `<MovieCard>` grid or empty state "No se encontraron películas para '{q}'" or no-query prompt "Escribe un término para buscar"
- [ ] 3.2 Verify `transition:name` values match `[peli].astro` (poster-{id} on img, title-{id} on title link)

## Phase 4: Integration & E2E

- [ ] 4.1 Modify `src/components/Navbar.astro` — add `action={`/${cine}/buscar`} method="GET"` and `name="q"` to desktop form (lines 14-28) and mobile form (lines 92-106); resolve cine from `Astro.url.pathname` fallback to `selectedCine` cookie → `"huajuapan"`
- [ ] 4.2 Create `tests/e2e/search.spec.ts` — Playwright E2E: navigate cine page, type in search, submit, assert results page, click movie, assert detail page with View Transition
