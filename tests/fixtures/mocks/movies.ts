/**
 * Mock movie data for testing.
 * Shape matches src/lib/types.ts Movie interface.
 */

export const mockMovies = [
  {
    id: '1001',
    title: 'Inception',
    duration: 148,
    genre: 'Science Fiction',
    classification: 'PG-13',
    billboard: true,
    trailer: 'https://youtube.com/watch?v=YoHD9XEInc0',
    director: 'Christopher Nolan',
    actors: 'Leonardo DiCaprio, Marion Cotillard',
    synopsis: 'A thief who steals corporate secrets through dream-sharing technology.',
    type: 'Largometraje',
    img_primary: 'https://example.com/inception-primary.jpg',
    img_secondary: 'https://example.com/inception-secondary.jpg',
    releaseDate: '2010-07-16',
    showtimes: [
      {
        id: 'show-1',
        hour: '19:00',
        subtitled: false,
        format: '2D',
        trasnoche: false,
      },
      {
        id: 'show-2',
        hour: '22:00',
        subtitled: true,
        format: '3D',
        trasnoche: false,
      },
    ],
  },
  {
    id: '1002',
    title: 'Interstellar',
    duration: 169,
    genre: 'Science Fiction',
    classification: 'PG-13',
    billboard: true,
    trailer: 'https://youtube.com/watch?v=zSID6PJpDUY',
    director: 'Christopher Nolan',
    actors: 'Matthew McConaughey, Anne Hathaway',
    synopsis: 'A team of astronauts travel through a wormhole near Saturn.',
    type: 'Largometraje',
    img_primary: 'https://example.com/interstellar-primary.jpg',
    img_secondary: 'https://example.com/interstellar-secondary.jpg',
    releaseDate: '2014-11-07',
    showtimes: [
      {
        id: 'show-3',
        hour: '18:30',
        subtitled: false,
        format: '2D',
        trasnoche: false,
      },
    ],
  },
  {
    id: '1003',
    title: 'The Dark Knight',
    duration: 152,
    genre: 'Action',
    classification: 'PG-13',
    billboard: false,
    trailer: 'https://youtube.com/watch?v=EXeTwQWrcwY',
    director: 'Christopher Nolan',
    actors: 'Christian Bale, Heath Ledger',
    synopsis: 'Batman faces off against the Joker, a criminal mastermind.',
    type: 'Largometraje',
    img_primary: 'https://example.com/dark-knight-primary.jpg',
    img_secondary: null,
    releaseDate: '2008-07-18',
    showtimes: [],
  },
];

/**
 * Get a single mock movie by ID.
 */
export function getMockMovieById(id: string) {
  return mockMovies.find((m) => m.id === id);
}

/**
 * Get mock movies filtered by genre.
 */
export function getMockMoviesByGenre(genre: string) {
  return mockMovies.filter(
    (m) => m.genre.toLowerCase() === genre.toLowerCase()
  );
}

/**
 * Get all movies currently in billboard.
 */
export function getMockBillboardMovies() {
  return mockMovies.filter((m) => m.billboard);
}
