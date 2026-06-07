import { useFavorites } from "@/lib/hooks/useFavorites";
import { toggleFavorite } from "@/lib/stores/favorites";

type Props = {
  cine: string;
  movieId: string;
  className?: string;
};

/**
 * Compact, icon-only favorite toggle. Designed to overlay a clickable card
 * (e.g. the trailer gallery slide) without competing for attention.
 *
 * Visual states:
 *  - Not favorited: black ribbon + white "+" overlay (the original design
 *    that lived in `TrailerGallery.astro`)
 *  - Favorited:     yellow ribbon + white filled-bookmark overlay
 *
 * Why a separate component from `FavoriteButton`:
 *  - Completely different visual treatment (icon-only vs. text+icon)
 *  - Different placement context (overlay on a slide vs. inline on a page)
 *  - Both share the SAME store actions (`toggleFavorite`) so the
 *    persistence and cross-component reactivity stay in sync.
 */
export default function IconFavoriteButton({
  cine,
  movieId,
  className,
}: Props) {
  const favorites = useFavorites();
  const isFav = favorites.some((f) => f.cine === cine && f.movieId === movieId);
  console.log(isFav + "-" + cine + "-" + movieId);

  const handleClick = (e: MouseEvent) => {
    // This button usually sits on top of a clickable link/poster. Stop
    // propagation so toggling doesn't navigate.
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(cine, movieId);
  };

  const ribbonFill = isFav ? "#facc15" : "#000000"; // yellow-400 vs black

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFav}
      aria-label={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
      data-testid={`icon-fav-${cine}-${movieId}`}
      class={`relative cursor-pointer opacity-70 hover:opacity-50 rounded-tl-xl overflow-hidden p-0 bg-transparent border-0 ${
        className ?? ""
      }`.trim()}
    >
      {/* Ribbon shape. The duplicate transparent polygon keeps the
			    pointer hit area stable across the notch on the bottom edge. */}
      <svg
        width="2rem"
        height="auto"
        viewBox="0 0 24 34"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon
          fill={ribbonFill}
          points="24 0 0 0 0 32 12.24 26.29 24 31.77"
        />
        <polygon
          fill="transparent"
          points="24 0 0 0 0 32 12.24 26.29 24 31.77"
        />
        <polygon
          fill={ribbonFill}
          points="24 31.77 24 33.77 12.24 28.29 0 34 0 32 12.24 26.29"
        />
      </svg>

      {/* Icon overlay. "+" when not favorited, filled bookmark when
			    favorited. The wrapper is positioned over the ribbon via the
			    same absolute trick the original used, but we keep the SVG
			    element itself relative to the button. */}
      <span
        class="absolute top-2.5 left-0 right-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        {isFav ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Filled bookmark glyph (lucide-style) */}
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="4.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-plus-icon lucide-plus"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        )}
      </span>
    </button>
  );
}
