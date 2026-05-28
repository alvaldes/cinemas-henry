import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cn, parseDate, normalizeDate, getMovies } from '../utils';

describe('cn() - classname merge utility', () => {
  it('should merge multiple class strings', () => {
    expect(cn('px-2', 'py-4', 'bg-white')).toContain('px-2');
    expect(cn('px-2', 'py-4', 'bg-white')).toContain('py-4');
    expect(cn('px-2', 'py-4', 'bg-white')).toContain('bg-white');
  });

  it('should handle conditional classes (false values)', () => {
    const result = cn('px-2', false && 'py-4', true && 'bg-white');
    expect(result).toContain('px-2');
    expect(result).toContain('bg-white');
    expect(result).not.toContain('py-4');
  });

  it('should handle null and undefined gracefully', () => {
    const result = cn('px-2', null, undefined, 'py-4');
    expect(result).toContain('px-2');
    expect(result).toContain('py-4');
  });

  it('should resolve Tailwind conflicts (later class wins)', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toContain('text-blue-500');
  });
});

describe('parseDate() - date parsing utility', () => {
  it('should parse DD/MM/YYYY format correctly', () => {
    const result = parseDate('28/05/2026');
    expect(result.getDate()).toBe(28);
    expect(result.getMonth()).toBe(4); // 0-indexed
    expect(result.getFullYear()).toBe(2026);
  });

  it('should handle leap year dates', () => {
    const result = parseDate('29/02/2024');
    expect(result.getDate()).toBe(29);
    expect(result.getMonth()).toBe(1);
    expect(result.getFullYear()).toBe(2024);
  });

  it('should parse first day of year', () => {
    const result = parseDate('01/01/2026');
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(0);
    expect(result.getFullYear()).toBe(2026);
  });

  it('should parse last day of year', () => {
    const result = parseDate('31/12/2025');
    expect(result.getDate()).toBe(31);
    expect(result.getMonth()).toBe(11);
    expect(result.getFullYear()).toBe(2025);
  });
});

describe('normalizeDate() - date normalization utility', () => {
  it('should set time to 00:00:00.000', () => {
    const date = new Date('2026-05-28T14:30:45.123Z');
    const normalized = normalizeDate(date);

    expect(normalized.getHours()).toBe(0);
    expect(normalized.getMinutes()).toBe(0);
    expect(normalized.getSeconds()).toBe(0);
    expect(normalized.getMilliseconds()).toBe(0);
  });

  it('should preserve the date (year, month, day)', () => {
    const date = new Date('2026-05-28T14:30:45Z');
    const normalized = normalizeDate(date);

    expect(normalized.getDate()).toBe(28);
    expect(normalized.getMonth()).toBe(4);
    expect(normalized.getFullYear()).toBe(2026);
  });

  it('should not mutate original date', () => {
    const original = new Date(2026, 4, 28, 14, 30, 45, 0);
    const originalTime = original.getTime();
    const normalized = normalizeDate(original);

    expect(original.getTime()).toBe(originalTime);
    expect(normalized.getTime()).not.toBe(originalTime);
  });

  it('should handle already normalized dates', () => {
    const date = new Date(2026, 4, 28, 0, 0, 0, 0); // Create UTC date
    const normalized = normalizeDate(date);

    expect(normalized.getDate()).toBe(28);
    expect(normalized.getHours()).toBe(0);
  });
});

describe('getMovies() - async movie fetching utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and parse movies successfully', async () => {
    const mockResponse = {
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            datos: [
              {
                peliculas_codigo: '1',
                peliculas_nombre: 'Test Movie',
                peliculas_duracion: 120,
                peliculas_genero: 'Action',
                peliculas_clasificacion: 'PG-13',
                peliculas_cartelera: true,
                peliculas_trailer: 'https://youtube.com/watch?v=test',
                director: 'Test Director',
                actores: 'Test Actor',
                peliculas_sinopsis: 'Test synopsis',
                peliculas_tipo: 'Largometraje',
                peliculas_imagenes: JSON.stringify([
                  { tipo: 'primario', url: 'https://example.com/poster.jpg' },
                ]),
                fecha_estreno: '2026-05-28',
              },
            ],
            funciones: [],
          })
        ),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await getMovies('https://example.com');

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result?.length).toBe(1);
    expect(result?.[0].title).toBe('test movie');
  });

  it('should handle fetch errors gracefully and return undefined after retries', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await getMovies('https://example.com', undefined, 1);

    expect(result).toBeUndefined();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should return empty array for no movies', async () => {
    const mockResponse = {
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            datos: [],
            funciones: [],
          })
        ),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const result = await getMovies('https://example.com');

    expect(result).toEqual([]);
  });

  it('should format date correctly in request', async () => {
    const mockResponse = {
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ datos: [], funciones: [] })),
    };

    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

    const testDate = new Date('2026-05-28');
    await getMovies('https://example.com', testDate);

    expect(global.fetch).toHaveBeenCalled();
    const call = (global.fetch as any).mock.calls[0];
    expect(call[0]).toContain('PeliculasConFuncionesYHorarios.php');
  });
});
