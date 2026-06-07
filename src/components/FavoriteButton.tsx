import { useFavorites } from "@/lib/hooks/useFavorites";
import { toggleFavorite } from "@/lib/stores/favorites";
import IconBookmark from "./IconBookmark";

type Props = {
	cine: string;
	movieId: string;
	className?: string;
};

/**
 * Interactive toggle for adding/removing a movie from the user's favorites.
 *
 * Visual states:
 *  - Not favorited: yellow filled button with outline bookmark ("Añadir a Favoritos")
 *  - Favorited:     white filled button with solid bookmark ("En favoritos")
 *
 * The visual treatment intentionally echoes the original static button that
 * lived in `[cine]/[peli].astro` so existing layouts don't shift around.
 */
export default function FavoriteButton({ cine, movieId, className }: Props) {
	const favorites = useFavorites();
	const isFav = favorites.some(
		(f) => f.cine === cine && f.movieId === movieId,
	);

	const handleClick = (e: MouseEvent) => {
		// The button often lives inside a clickable <article>/<a>. Stop
		// propagation so toggling a favorite doesn't navigate to the detail.
		e.preventDefault();
		e.stopPropagation();
		toggleFavorite(cine, movieId);
	};

	const baseClass =
		"flex items-center justify-center gap-2 rounded-3xl py-2 px-4 font-bold cursor-pointer transition-colors w-full";
	const stateClass = isFav
		? "bg-white text-black hover:bg-neutral-200"
		: "bg-yellow-400 text-black hover:bg-yellow-500";

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-pressed={isFav}
			aria-label={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
			class={`${baseClass} ${stateClass} ${className ?? ""}`.trim()}
		>
			<IconBookmark size="20" filled={isFav} />
			<span>{isFav ? "En favoritos" : "Añadir a Favoritos"}</span>
		</button>
	);
}
