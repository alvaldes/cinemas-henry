import { useEffect, useState } from "preact/hooks";
import { useFavorites } from "@/lib/hooks/useFavorites";
import {
  clearFavorites,
  removeFavorite,
  groupFavoritesByCine,
} from "@/lib/stores/favorites";
import type { Movie } from "@/lib/types";
import { titleCase } from "@/lib/utils";
import IconBookmark from "./IconBookmark";
import IconTrash2 from "./IconTrash2";

type CineMovies = {
  loading: boolean;
  error: string | null;
  movies: Map<string, Movie>; // movieId -> Movie
};

type CineMoviesState = Record<string, CineMovies>;

/**
 * Renders the user's favorite movies grouped by cine. Fetches each cine's
 * movie list once and filters in-memory, matching the pattern already used
 * in `[cine]/[peli].astro` for consistency.
 *
 * States handled:
 *  - Hydration: localStorage hasn't been read yet (brief flicker on first paint)
 *  - Empty: no favorites
 *  - Loading per cine: skeleton-like message
 *  - Per-cine error: shown inline so other cines still render
 *  - Loaded: grid of cards with a remove button
 */
export default function FavoritesList() {
  const favorites = useFavorites();

  // Group favorites by cine. Re-derived on every render — cheap (small list).
  const groups = groupFavoritesByCine(favorites);
  const cineIds = groups.map((g) => g.cine);

  // Per-cine fetch state. Keyed by cine value.
  const [state, setState] = useState<CineMoviesState>({});

  useEffect(() => {
    // Fetch each cine's movie list once. If we already have a non-empty
    // map for that cine, skip — the data doesn't change while the user
    // is browsing the watchlist.
    const cinesToFetch = cineIds.filter(
      (cine) =>
        !state[cine] || (state[cine].movies.size === 0 && !state[cine].error),
    );
    if (cinesToFetch.length === 0) return;

    let cancelled = false;

    // Mark loading for each cine we are about to fetch
    setState((prev) => {
      const next = { ...prev };
      for (const cine of cinesToFetch) {
        if (!next[cine]) {
          next[cine] = { loading: true, error: null, movies: new Map() };
        }
      }
      return next;
    });

    (async () => {
      await Promise.all(
        cinesToFetch.map(async (cine) => {
          try {
            const res = await fetch(`/api/peliculas/${cine}.json`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Movie[] = await res.json();
            if (cancelled) return;
            const map = new Map<string, Movie>();
            for (const m of data) map.set(m.id, m);
            setState((prev) => ({
              ...prev,
              [cine]: { loading: false, error: null, movies: map },
            }));

            // Auto-remove stale favorites no longer in the cine's movie list
            const group = groups.find((g) => g.cine === cine);
            if (group) {
              for (const fav of group.items) {
                if (!map.has(fav.movieId)) {
                  removeFavorite(fav.cine, fav.movieId);
                }
              }
            }
          } catch (err) {
            if (cancelled) return;
            setState((prev) => ({
              ...prev,
              [cine]: {
                loading: false,
                error:
                  err instanceof Error
                    ? err.message
                    : "No se pudieron cargar las películas.",
                movies: new Map(),
              },
            }));
          }
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
    // We intentionally only depend on cineIds — re-running the fetch when
    // the underlying data changes would be wasteful and risks races.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cineIds.join("|")]);

  // True when every cine group has finished fetching movies (success or error).
  // The clear-all button stays hidden while movies are still loading so the
  // user doesn't see a destructive action alongside skeleton / loading text.
  const allCinesLoaded =
    groups.length > 0 &&
    groups.every((g) => {
      const s = state[g.cine];
      return s && !s.loading;
    });

  // --- Render helpers ---------------------------------------------------

  if (favorites.length === 0) {
    return (
      <div
        class="text-center pt-16 text-gray-400"
        data-testid="favorites-empty"
      >
        <IconBookmark size="48" color="currentColor" />
        <p class="mt-4 text-lg">No tienes favoritos todavía.</p>
        <p class="mt-2 text-sm">
          Añade películas desde su página de detalle y aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-10">
      {groups.map((group) => {
        const cineState = state[group.cine];
        return (
          <section
            key={group.cine}
            data-testid={`favorites-cine-${group.cine}`}
            class={"mb-2"}
          >
            <h2 class="text-base font-semibold flex items-center mb-3">
              <span class="text-yellow-400 mr-1 text-xl">|</span>
              {titleCase(group.cine)}
            </h2>

            {cineState?.error && (
              <div
                class="text-sm text-red-400 mb-3"
                role="alert"
                data-testid={`favorites-error-${group.cine}`}
              >
                No se pudieron cargar las películas de {group.cine}:{" "}
                {cineState.error}
              </div>
            )}

            {cineState?.loading && !cineState.error && (
              <div
                class="text-sm text-gray-400 mb-3"
                data-testid={`favorites-loading-${group.cine}`}
              >
                Cargando películas…
              </div>
            )}

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {group.items.map((fav) => {
                const movie = cineState?.movies.get(fav.movieId);
                if (cineState && !cineState.loading && !movie) {
                  // Movie was favorited but no longer exists in the cine.
                  // We still render a placeholder so the user can clean it up.
                  return (
                    <article
                      key={`${fav.cine}:${fav.movieId}`}
                      class="bg-neutral-900 rounded-2xl shadow-md overflow-hidden opacity-60"
                      data-testid={`favorites-card-${fav.cine}-${fav.movieId}`}
                    >
                      <div class="aspect-[2/3] bg-neutral-800 flex items-center justify-center text-gray-500 text-xs">
                        No disponible
                      </div>
                      <div class="p-3">
                        <p class="text-xs text-gray-400 mb-2">
                          ID: {fav.movieId}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFavorite(fav.cine, fav.movieId)}
                          class="w-full text-xs py-1.5 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-gray-200"
                        >
                          Quitar
                        </button>
                      </div>
                    </article>
                  );
                }
                if (!movie) return null;
                return (
                  <article
                    key={`${fav.cine}:${fav.movieId}`}
                    class="bg-neutral-900 rounded-2xl shadow-md overflow-hidden group"
                    data-testid={`favorites-card-${fav.cine}-${fav.movieId}`}
                  >
                    <div class="relative overflow-hidden">
                      <a
                        href={`/${fav.cine}/${encodeURIComponent(fav.movieId)}`}
                      >
                        <img
                          src={movie.img_primary}
                          alt={movie.title}
                          class="object-cover w-full aspect-[2/3] transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeFavorite(fav.cine, fav.movieId)}
                        aria-label="Quitar de favoritos"
                        class="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-yellow-400 transition-colors cursor-pointer"
                      >
                        <IconBookmark size="16" filled />
                      </button>
                    </div>
                    <div class="p-3">
                      <h3 class="text-sm font-medium capitalize leading-tight line-clamp-2">
                        <a
                          href={`/${fav.cine}/${encodeURIComponent(fav.movieId)}`}
                          class="hover:text-yellow-400"
                        >
                          {movie.title}
                        </a>
                      </h3>
                      <p class="text-xs text-gray-400 mt-1 capitalize">
                        {movie.genre}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {allCinesLoaded && (
        <div class="flex justify-center pt-6 border-t border-neutral-700">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("¿Borrar todas las películas de favoritos?")) {
                clearFavorites();
              }
            }}
            class="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
            data-testid="clear-all-favorites"
          >
            <IconTrash2 size="14" />
            Vaciar Favoritos
          </button>
        </div>
      )}
    </div>
  );
}
