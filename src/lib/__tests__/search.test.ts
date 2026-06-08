import { describe, it, expect } from 'vitest';
import { searchMovies } from '../utils';
import type { Movie } from '../types';

const mockMovies: Movie[] = [
  {
    id: 'avengers-01',
    title: 'Avengers: Endgame',
    duration: '181',
    genre: 'Acción',
    classification: 'PG-13',
    billboard: '1',
    trailer: 'https://youtube.com/watch?v=test',
    director: 'Anthony Russo',
    actors: 'Robert Downey Jr., Chris Evans, Scarlett Johansson',
    synopsis: 'Los Vengadores se reúnen',
    type: 'Largometraje',
    img_primary: 'https://example.com/avengers.jpg',
    releaseDate: '26/04/2026',
    showtimes: [],
  },
  {
    id: 'inception-01',
    title: 'Inception',
    duration: '148',
    genre: 'Ciencia Ficción',
    classification: 'PG-13',
    billboard: '1',
    trailer: 'https://youtube.com/watch?v=inception',
    director: 'Christopher Nolan',
    actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt',
    synopsis: 'Un ladrón que roba secretos',
    type: 'Largometraje',
    img_primary: 'https://example.com/inception.jpg',
    releaseDate: '16/07/2026',
    showtimes: [],
  },
  {
    id: 'inside-out-01',
    title: 'Inside Out',
    duration: '95',
    genre: 'Animación',
    classification: 'PG',
    billboard: '1',
    trailer: 'https://youtube.com/watch?v=insideout',
    director: 'Pete Docter',
    actors: 'Amy Poehler, Bill Hader',
    synopsis: 'Las emociones de una niña',
    type: 'Largometraje',
    img_primary: 'https://example.com/insideout.jpg',
    releaseDate: '19/06/2026',
    showtimes: [],
  },
];

describe('searchMovies()', () => {
  it('should match by title (partial, case-insensitive)', () => {
    const result = searchMovies(mockMovies, 'avengers');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('avengers-01');
  });

  it('should match by genre', () => {
    const result = searchMovies(mockMovies, 'animación');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('inside-out-01');
  });

  it('should match by director', () => {
    const result = searchMovies(mockMovies, 'nolan');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('inception-01');
  });

  it('should match by actor name (partial within comma-separated list)', () => {
    const result = searchMovies(mockMovies, 'evans');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('avengers-01');
  });

  it('should match actor with first name only', () => {
    const result = searchMovies(mockMovies, 'robert');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('avengers-01');
  });

  it('should return empty array when no matches', () => {
    const result = searchMovies(mockMovies, 'zzznotfound');
    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty query', () => {
    const result = searchMovies(mockMovies, '');
    expect(result).toHaveLength(0);
  });

  it('should return empty array for whitespace-only query', () => {
    const result = searchMovies(mockMovies, '   ');
    expect(result).toHaveLength(0);
  });

  it('should be case insensitive', () => {
    const result = searchMovies(mockMovies, 'AVENGERS');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('avengers-01');
  });

  it('should order results: title matches first, then others', () => {
    const movies: Movie[] = [
      ...mockMovies,
      {
        id: 'nolan-doc',
        title: 'The Magic of Nolan',
        duration: '90',
        genre: 'Documental',
        classification: 'PG',
        billboard: '0',
        trailer: '',
        director: 'Someone Else',
        actors: 'Actor X',
        synopsis: 'A documentary about Nolan',
        type: 'Largometraje',
        img_primary: '',
        releaseDate: '01/01/2026',
        showtimes: [],
      },
    ];

    const result = searchMovies(movies, 'nolan');
    // The movie with "Nolan" in title should come first
    expect(result[0].id).toBe('nolan-doc');
    expect(result[1].id).toBe('inception-01');
  });

  it('should handle empty movies array', () => {
    const result = searchMovies([], 'avengers');
    expect(result).toHaveLength(0);
  });

  it('should handle null/undefined optional fields gracefully', () => {
    const incompleteMovies: Movie[] = [
      {
        id: 'no-genre',
        title: 'No Genre Movie',
        duration: '90',
        genre: '',
        classification: '',
        billboard: '0',
        trailer: '',
        director: '',
        actors: '',
        synopsis: '',
        type: '',
        img_primary: '',
        releaseDate: '',
        showtimes: [],
      },
    ];

    const result = searchMovies(incompleteMovies, 'no');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('no-genre');
  });
});
