import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  renderShowtimesChips,
  renderShowtimeEntry,
  renderMoviesGrid,
  createDateChangeHandler,
} from '../cartelera';
import type { Movie, Showtime } from '../types';
import { formatDuration } from '../utils';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const movieWithShowtimes: Movie = {
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
  showtimes: [
    { id: 'st1', hour: '16:30', subtitled: true, format: '2D', trasnoche: false },
    { id: 'st2', hour: '19:00', subtitled: false, format: 'XD', trasnoche: false },
    { id: 'st3', hour: '21:45', subtitled: true, format: '3D', trasnoche: false },
  ],
};

const movieWithoutShowtimes: Movie = {
  ...movieWithShowtimes,
  id: 'batman-02',
  title: 'The Batman',
  showtimes: [],
};

const cine = 'huajuapan';

// ---------------------------------------------------------------------------
// renderShowtimesChips
// ---------------------------------------------------------------------------

describe('renderShowtimesChips()', () => {
  it('should render showtime chips with hour, format, and subtitled badge', () => {
    const html = renderShowtimesChips(movieWithShowtimes.showtimes);

    // Each showtime's hour appears
    expect(html).toContain('16:30');
    expect(html).toContain('19:00');
    expect(html).toContain('21:45');

    // Each showtime's format appears
    expect(html).toContain('2D');
    expect(html).toContain('XD');
    expect(html).toContain('3D');

    // Subtitled showtimes have "SUB" badge (abbreviated per design)
    expect(html).toContain('SUB');

    // Dubbed (non-subtitled) showtime has "Dob" badge (abbreviated per design)
    expect(html).toContain('Dob');
  });

  it('should return empty string for empty showtimes array (fallback handled by parent)', () => {
    const html = renderShowtimesChips([]);
    expect(html).toBe('');
  });

  it('should render nothing (empty string) for null/undefined showtimes', () => {
    expect(renderShowtimesChips(null as unknown as Showtime[])).toBe('');
    expect(renderShowtimesChips(undefined as unknown as Showtime[])).toBe('');
  });
});

// ---------------------------------------------------------------------------
// renderShowtimeEntry
// ---------------------------------------------------------------------------

describe('renderShowtimeEntry()', () => {
  const showtime = movieWithShowtimes.showtimes[0];

  it('should render hour prominently in yellow', () => {
    const html = renderShowtimeEntry(movieWithShowtimes, showtime, cine);
    expect(html).toContain('4:30 PM');
  });

  it('should render poster image with correct src', () => {
    const html = renderShowtimeEntry(movieWithShowtimes, showtime, cine);

    expect(html).toContain(movieWithShowtimes.img_primary);
    expect(html).toContain('<img');
  });

  it('should render title as a link to the movie detail page', () => {
    const html = renderShowtimeEntry(movieWithShowtimes, showtime, cine);

    expect(html).toContain('Avengers: Endgame');
    expect(html).toContain(`/${cine}/${encodeURIComponent(movieWithShowtimes.id)}`);
  });

  it('should render format badge', () => {
    const html = renderShowtimeEntry(movieWithShowtimes, showtime, cine);
    expect(html).toContain('2D');
  });

  it('should render subtitled/dubbed badge', () => {
    const html = renderShowtimeEntry(movieWithShowtimes, showtime, cine);
    expect(html).toContain('SUB');
  });
});

// ---------------------------------------------------------------------------
// renderMoviesGrid
// ---------------------------------------------------------------------------

describe('renderMoviesGrid()', () => {
  const movies = [movieWithShowtimes, movieWithoutShowtimes];

  it('should render flat showtime list sorted by hour', () => {
    const html = renderMoviesGrid(movies, cine);

    // Movies with showtimes appear
    expect(html).toContain('Avengers: Endgame');

    // Movie without showtimes is excluded from flat list
    expect(html).not.toContain('The Batman');

    // All showtimes appear in AM/PM format, sorted by hour (4:30 PM, 7:00 PM, 9:45 PM)
    expect(html).toContain('4:30 PM');
    expect(html).toContain('7:00 PM');
    expect(html).toContain('9:45 PM');

    // Verify sort order: 4:30 PM comes before 7:00 PM
    expect(html.indexOf('4:30 PM')).toBeLessThan(html.indexOf('7:00 PM'));
    expect(html.indexOf('7:00 PM')).toBeLessThan(html.indexOf('9:45 PM'));
  });

  it('should render empty state when movies array is empty', () => {
    const html = renderMoviesGrid([], cine);
    expect(html).toContain('No hay películas disponibles para esta fecha');
  });

  it('should render empty state when movies is null/undefined', () => {
    expect(renderMoviesGrid(null as unknown as Movie[], cine)).toContain(
      'No hay películas disponibles para esta fecha',
    );
    expect(renderMoviesGrid(undefined as unknown as Movie[], cine)).toContain(
      'No hay películas disponibles para esta fecha',
    );
  });
});

// ---------------------------------------------------------------------------
// createDateChangeHandler (client re-render)
// ---------------------------------------------------------------------------

describe('createDateChangeHandler()', () => {
  let gridEl: HTMLDivElement;

  beforeEach(() => {
    // Set up DOM with initial grid
    vi.useFakeTimers();
    gridEl = document.createElement('div');
    gridEl.id = 'showtimes-grid';
    gridEl.innerHTML = '<div>Initial grid content</div>';
    document.body.appendChild(gridEl);

    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.removeChild(gridEl);
  });

  it('should fetch movies for the new date and update the grid', async () => {
    const newMovies: Movie[] = [
      {
        ...movieWithShowtimes,
        id: 'spiderman-03',
        title: 'Spider-Man: No Way Home',
        showtimes: [
          { id: 'st4', hour: '18:00', subtitled: true, format: '2D', trasnoche: false },
        ],
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => newMovies,
    });

    const handler = createDateChangeHandler(cine);
    const event = new CustomEvent('dateChange', {
      detail: { date: new Date('2026-06-10') },
    });

    await handler(event);

    // Fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchUrl).toContain(`/api/peliculas/${cine}.json`);
    expect(fetchUrl).toContain('date=2026-06-10');

    // Grid was updated with new content
    expect(gridEl.innerHTML).toContain('Spider-Man: No Way Home');
    expect(gridEl.innerHTML).toContain('6:00 PM');
  });

  it('should not crash when event has no detail.date (edge case)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const handler = createDateChangeHandler(cine);
    const event = new CustomEvent('dateChange', {}); // no detail

    // Should not throw
    await expect(handler(event)).resolves.toBeUndefined();
  });

  it('should show loading state while fetching', async () => {
    // Create a handler with manual promise control
    const handler = createDateChangeHandler(cine);

    // Use a deferred promise so we can check the loading state mid-fetch
    let resolvePromise!: (value: unknown) => void;
    const deferredPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(deferredPromise);

    const event = new CustomEvent('dateChange', {
      detail: { date: new Date('2026-06-10') },
    });

    // Dispatch the event (this starts the handler which shows loading)
    const handlerPromise = handler(event);

    // After microtask queue processes, the loading state should be set
    await vi.waitFor(() => {
      expect(gridEl.innerHTML).toContain('Cargando funciones');
    });

    // Now resolve the fetch
    resolvePromise({ ok: true, json: async () => [] });

    await handlerPromise;
  });

  it('should preserve previous grid on API fetch error', async () => {
    const initialContent = '<div>Original movies grid</div>';
    gridEl.innerHTML = initialContent;

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = createDateChangeHandler(cine);
    const event = new CustomEvent('dateChange', {
      detail: { date: new Date('2026-06-10') },
    });

    await handler(event);

    // Previous grid should be restored after error
    expect(gridEl.innerHTML).toBe(initialContent);

    // Error was logged
    expect(consoleSpy).toHaveBeenCalledWith('Error al actualizar funciones:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should preserve previous grid on non-ok API response', async () => {
    const initialContent = '<div>Original movies grid</div>';
    gridEl.innerHTML = initialContent;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = createDateChangeHandler(cine);
    const event = new CustomEvent('dateChange', {
      detail: { date: new Date('2026-06-10') },
    });

    await handler(event);

    // Previous grid should be restored after error
    expect(gridEl.innerHTML).toBe(initialContent);

    expect(consoleSpy).toHaveBeenCalledWith('Error al obtener funciones para la nueva fecha');

    consoleSpy.mockRestore();
  });

  it('should render "No hay películas" when API returns empty array', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const handler = createDateChangeHandler(cine);
    const event = new CustomEvent('dateChange', {
      detail: { date: new Date('2026-06-10') },
    });

    await handler(event);

    expect(gridEl.innerHTML).toContain('No hay películas disponibles para esta fecha');
  });
});
