import type { Movie, Showtime } from './types';
import { formatDuration, formatToAmPm } from './utils';

/**
 * Render showtime chips HTML.
 * Each chip shows: hour, format, and subtitled/dubbed badge.
 */
export function renderShowtimesChips(showtimes: Showtime[]): string {
  if (!showtimes || showtimes.length === 0) {
    return '';
  }

  return showtimes
    .map(
      (st) => `
            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-medium leading-none">
              <span>${st.hour}</span>
              <span class="text-blue-400">${st.format}</span>
              <span class="${st.subtitled ? 'bg-blue-400/10 text-blue-300' : 'bg-gray-400/10 text-gray-400'} px-1 py-0.5 rounded-full text-[8px] leading-none">
                ${st.subtitled ? 'SUB' : 'Dob'}
              </span>
            </span>`,
    )
    .join('');
}

/**
 * Render a single showtime entry row for the flat cartelera list.
 */
export function renderShowtimeEntry(movie: Movie, showtime: Showtime, cine: string): string {
  return `
    <div class="flex items-center gap-3 px-2 py-2.5 border-b border-gray-800 hover:bg-white/5 transition-colors">
      <span class="font-medium text-sm text-yellow-400 w-16 shrink-0">${formatToAmPm(showtime.hour)}</span>
      <a href="/${cine}/${encodeURIComponent(movie.id)}" class="shrink-0">
        <img src="${movie.img_primary}" alt="" class="w-6 md:w-8 rounded aspect-[2/3] object-cover" loading="lazy" />
      </a>
      <a href="/${cine}/${encodeURIComponent(movie.id)}" class="text-sm text-white hover:text-blue-400 line-clamp-1 flex-1 min-w-0 capitalize no-underline">
        ${movie.title}
      </a>
      <span class="text-xs text-blue-400 shrink-0">${showtime.format}</span>
      <span class="${showtime.subtitled ? 'bg-blue-400/10 text-blue-300' : 'bg-gray-400/10 text-gray-400'} text-[10px] px-1.5 py-0.5 rounded-full shrink-0 leading-none">
        ${showtime.subtitled ? 'SUB' : 'Dob'}
      </span>
    </div>`;
}

/**
 * Render the full flat showtime list HTML.
 * Flattens all movies into individual showtime entries sorted by hour.
 */
export function renderMoviesGrid(movies: Movie[], cine: string): string {
  if (!movies || movies.length === 0) {
    return '<p class="text-center text-gray-400 py-12">No hay películas disponibles para esta fecha</p>';
  }

  const entries = movies
    .flatMap((movie) =>
      (movie.showtimes || []).map((st) => ({ movie, showtime: st })),
    )
    .sort((a, b) => a.showtime.hour.localeCompare(b.showtime.hour));

  return entries.map(({ movie, showtime }) => renderShowtimeEntry(movie, showtime, cine)).join('');
}

/**
 * Create a date-change event handler for client-side re-render.
 * Uses the same pattern as [peli].astro: fetch → template string → replace innerHTML.
 */
export function createDateChangeHandler(cine: string) {
  return async (event: Event) => {
    const customEvent = event as CustomEvent;
    const newDate = customEvent.detail?.date as Date | undefined;

    if (!newDate) return;

    const dateStr = newDate.toISOString().split('T')[0];
    const gridEl = document.getElementById('showtimes-grid');
    if (!gridEl) return;

    // Save previous state for error recovery
    const previousHtml = gridEl.innerHTML;

    // Show loading state
    gridEl.innerHTML =
      '<div class="text-center py-8"><p class="text-gray-400">Cargando funciones...</p></div>';

    try {
      const response = await fetch(`/api/peliculas/${cine}.json?date=${dateStr}`);

      if (!response.ok) {
        console.error('Error al obtener funciones para la nueva fecha');
        gridEl.innerHTML = previousHtml;
        return;
      }

      const movies: Movie[] = await response.json();
      gridEl.innerHTML = renderMoviesGrid(movies, cine);
    } catch (error) {
      console.error('Error al actualizar funciones:', error);
      gridEl.innerHTML = previousHtml;
    }
  };
}
