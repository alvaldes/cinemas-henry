import { useFavorites } from "@/lib/hooks/useFavorites";
import { toggleFavorite } from "@/lib/stores/favorites";

type Props = {
  cine: string;
  movieId: string;
  className?: string;
};

/**
 * Circular icon-only favorite toggle, designed to overlay a poster card
 * (e.g. the `NowPlaying` carousel). Standard streaming-service pattern:
 * semi-transparent dark circle in the top-right of the poster.
 *
 * Visual states:
 *  - Not favorited: dark circle + outline bookmark icon
 *  - Favorited:     dark circle + filled yellow bookmark icon
 *
 * Why a separate component from `IconFavoriteButton`:
 *  - The gallery uses a ribbon/banner shape (movie-slate aesthetic); poster
 *    cards use a circle. Forcing both into one component with a `variant`
 *    prop would couple two unrelated visual treatments. The toggle logic
 *    is shared via the store, which is the right level of reuse.
 *  - `IconFavoriteButton` lives in a "ribbon" context (overlaying a video
 *    slide); this one lives in a "card" context. Different positioning,
 *    different sizing, different user expectations.
 */
export default function PosterFavoriteButton({
  cine,
  movieId,
  className,
}: Props) {
  const favorites = useFavorites();
  const isFav = favorites.some((f) => f.cine === cine && f.movieId === movieId);

  const handleClick = (e: MouseEvent) => {
    // The button overlays a clickable link wrapping the poster. Stop
    // the event so toggling doesn't navigate to the detail page.
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(cine, movieId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFav}
      aria-label={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
      data-testid={`poster-fav-${cine}-${movieId}`}
      class={`absolute top-2 right-2 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white cursor-pointer transition-colors backdrop-blur-sm ${
        className ?? ""
      }`.trim()}
    >
      {/* Lucide bookmark. Filled yellow when favorited, outline white
			    otherwise. We use a single inline SVG with conditional `fill`
			    so the transition between states stays crisp. */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isFav ? "#facc15" : "none"}
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    </button>
  );
}
