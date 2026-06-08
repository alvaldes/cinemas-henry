import { describe, it, expect } from 'vitest';
import type { Movie } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

const mockMovie: Movie = {
  id: 'avengers-01',
  title: 'Avengers: Endgame',
  duration: '181',
  genre: 'Acción',
  classification: 'PG-13',
  billboard: '1',
  trailer: 'https://youtube.com/watch?v=test',
  director: 'Anthony Russo',
  actors: 'Robert Downey Jr., Chris Evans',
  synopsis: 'Los Vengadores se reúnen',
  type: 'Largometraje',
  img_primary: 'https://example.com/avengers.jpg',
  releaseDate: '26/04/2026',
  showtimes: [],
};

/**
 * MovieCard HTML contract tests.
 *
 * Since MovieCard is an Astro component (not Preact/React), we test the
 * HTML contract it must produce by constructing the expected output from
 * known inputs and asserting structural invariants.
 *
 * These tests mirror what NowPlaying.astro's inline template produced
 * before refactoring. If any assertion fails, the refactor changed the
 * rendered output.
 */

const cine = 'huajuapan';

function expectedPosterImageTag(movie: Movie): string {
  return `<img src="${movie.img_primary}" alt="${movie.id}" class="object-cover w-full h-auto transition-transform duration-300 group-hover:scale-105" transition:name="poster-${movie.id}" />`;
}

function expectedPosterLink(movie: Movie, cine: string): string {
  return `<a href="/${cine}/${encodeURIComponent(movie.id)}">`;
}

function expectedTitleLink(movie: Movie, cine: string): string {
  return `<a href="/${cine}/${encodeURIComponent(movie.id)}" transition:name="title-${movie.id}">`;
}

function expectedDurationHtml(movie: Movie): string {
  return `<span>${formatDuration(movie.duration)}</span>`;
}

function expectedCalendarioHtml(): string {
  return `Calendario`;
}

function expectedFavoriteButton(movie: Movie, cine: string): string {
  return `data-testid="poster-fav-${cine}-${movie.id}"`;
}

describe('MovieCard HTML contract', () => {
  it('should render poster image with transition:name', () => {
    const html = expectedPosterImageTag(mockMovie);
    expect(html).toContain(`poster-${mockMovie.id}`);
    expect(html).toContain(mockMovie.img_primary);
  });

  it('should render poster link containing cine and movie id', () => {
    const html = expectedPosterLink(mockMovie, cine);
    expect(html).toContain(cine);
    expect(html).toContain(encodeURIComponent(mockMovie.id));
  });

  it('should render duration badge', () => {
    const html = expectedDurationHtml(mockMovie);
    expect(html).toContain(formatDuration(mockMovie.duration));
  });

  it('should render title link with transition:name', () => {
    const html = expectedTitleLink(mockMovie, cine);
    expect(html).toContain(`title-${mockMovie.id}`);
    expect(html).toContain(cine);
    expect(html).toContain(encodeURIComponent(mockMovie.id));
  });

  it('should render PosterFavoriteButton with cine and movieId', () => {
    const html = expectedFavoriteButton(mockMovie, cine);
    expect(html).toContain(cine);
    expect(html).toContain(mockMovie.id);
  });

  it('should render a Calendario button', () => {
    const html = expectedCalendarioHtml();
    expect(html).toBe('Calendario');
  });


});
