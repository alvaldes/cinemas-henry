# movie-search Specification

## Purpose

Search movies by free text across title, genre, director, and actors. Results render
server-side on `/{cine}/buscar?q=`. MovieCard shared between NowPlaying and results.

## Requirements

### R1: Search Form in Navbar

The Navbar MUST submit both desktop and mobile forms via GET to `/{cine}/buscar?q=`.
Cine MUST resolve from URL pathname, falling back to the `selectedCine` cookie or
default `"huajuapan"`.

**Acceptance Criteria:** Desktop action, method, name="q" correct; mobile same; cine
fallback works.

#### Scenario: Desktop search — cine page
- GIVEN user is on `/huajuapan`
- WHEN typing "avengers" in desktop search and submitting
- THEN browser navigates to `/huajuapan/buscar?q=avengers`

#### Scenario: Search — non-cine page with cookie
- GIVEN user is on `/watchlist` with `selectedCine=tlaxiaco`
- WHEN submitting search
- THEN browser navigates to `/tlaxiaco/buscar?q={termino}`

#### Scenario: Search — non-cine page no cookie
- GIVEN user is on `/watchlist` without `selectedCine` cookie
- WHEN submitting search
- THEN browser navigates to `/huajuapan/buscar?q={termino}`

### R2: Search Results Page

The system MUST provide SSR page at `[cine]/buscar.astro`. It MUST read `q` from query
params, fetch movies from the cine API, and filter by substring match (case-insensitive)
across `title`, `genre`, `director`, and `actors`. Individual actor names MUST be
matched within the comma-separated field. If `q` is absent, the page SHOULD show a prompt.

Results MUST render with `<MovieCard>`. Posters and titles MUST carry `transition:name`
matching `[peli].astro` (`poster-{id}` / `title-{id}`).

**Acceptance Criteria:** Title match, genre match, director match, actor match by name;
empty state "No se encontraron películas para '{q}'"; no-query prompt; transition:name
on img and a.

#### Scenario: Happy path — title match
- GIVEN cine "huajuapan" has movie "Avengers: Endgame"
- WHEN navigating to `/huajuapan/buscar?q=avengers`
- THEN movie card renders in results

#### Scenario: Match by genre
- GIVEN a movie with genre "Animación"
- WHEN searching `animación`
- THEN that movie renders in results

#### Scenario: Match by director
- GIVEN a movie directed by "Christopher Nolan"
- WHEN searching `nolan`
- THEN that movie renders

#### Scenario: Match by actor
- GIVEN a movie with actors "Robert Downey Jr., Chris Evans"
- WHEN searching `evans`
- THEN that movie renders

#### Scenario: Empty results
- GIVEN no movie matches "zzznotfound"
- WHEN searching `zzznotfound`
- THEN "No se encontraron películas para 'zzznotfound'" displays

#### Scenario: No query parameter
- GIVEN user navigates to `/huajuapan/buscar` without `?q=`
- WHEN page renders
- THEN a prompt message displays instead of results

### R3: MovieCard Component

The system MUST provide `MovieCard.astro` accepting `{ movie: Movie, cine: string }`.
It MUST render identical output to lines 31–63 of `NowPlaying.astro` (poster with hover
overlay, favorite button, duration badge, title link, Calendario button).
`NowPlaying.astro` MUST use `<MovieCard>` replacing the inline markup.

**Acceptance Criteria:** Visual match; links contain cine; transition:name on poster and
title; NowPlaying output unchanged.

#### Scenario: MovieCard attributes
- GIVEN MovieCard with mock movie and cine="huajuapan"
- WHEN rendered
- THEN poster link targets `/huajuapan/{movie.id}`
- AND `transition:name="poster-{id}"` on img
- AND `transition:name="title-{id}"` on title a

#### Scenario: NowPlaying uses MovieCard
- GIVEN NowPlaying receives a movie list
- WHEN rendering swiper-container
- THEN each swiper-slide contains `<MovieCard>`

## Out of Scope

Client-side filtering, autocomplete, cross-cine search, pagination, extra filters
(date, classification, price), fuzzy search.

## Test Considerations

Strict TDD (`strict_tdd: true`). Tests pass before implementation (`bun test`):

| Layer | What | Likely Path |
|-------|------|-------------|
| Unit | Filter function: match 4 fields CI, no match, empty q, special chars | `src/lib/__tests__/search.test.ts` |
| Component | MovieCard renders with mock, cine on links, transition:name | `src/components/__tests__/MovieCard.test.tsx` |
| Component | buscar.astro renders results vs empty vs no-query | `src/components/__tests__/SearchPage.test.tsx` |
| E2E | Navbar search → results → click → detail page | `tests/e2e/search.spec.ts` |
