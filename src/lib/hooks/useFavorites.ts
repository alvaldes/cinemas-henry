import { useEffect, useState } from "preact/hooks";
import {
	$favorites,
	initFavorites,
	readFavoritesFromStorage,
	type Favorite,
} from "@/lib/stores/favorites";

/**
 * Read the favorites list AND ensure it has been hydrated from
 * localStorage.
 *
 * Why this hook exists:
 *
 * `useStore($favorites)` alone returns the live list, but the store starts
 * empty on every page load until `initFavorites()` runs. Previously the only
 * place that called it was `<FavoritesList client:load />`, which meant a
 * user landing on a movie detail page after favoriting movies elsewhere
 * would see the button in its empty/"not favorited" state until they
 * happened to visit /watchlist.
 *
 * This hook is idempotent: `initFavorites()` is a no-op after the first
 * call (guarded by a module-local `hydrated` flag), so mounting the hook
 * from many components is free.
 *
 * Why the initializer reads from localStorage AND the effect still sets state:
 *
 * On the server, `readFavoritesFromStorage()` returns `[]` (no localStorage),
 * so SSR produces `isFav = false` and `fill="#000000"` in the HTML. During
 * hydration, Preact reuses the server's `[]` state — it does NOT re-run the
 * initializer. The result: SVG `fill` attributes stay dark ("not favorited")
 * even if the user has favorites saved, because Preact does not re-apply SVG
 * attribute changes during hydration.
 *
 * The effect re-renders AFTER hydration, producing a fresh virtual DOM that
 * Preact diffs against the current DOM. This forces SVG attribute updates.
 *
 * So why not keep `useState([])` then? Because `readFavoritesFromStorage()`
 * in the initializer gives a correct first paint on CLIENT-SIDE re-mounts
 * that skip SSR (e.g. Astro view transitions). In that case the initializer
 * runs on the client with real localStorage data, and the effect re-render
 * is a no-op (same data, harmless).
 *
 * The `<FavoriteButton>` on the detail page doesn't hit this bug because
 * it uses CSS classes (`bg-yellow-400`) instead of SVG `fill` attributes.
 * Preact handles class diffing correctly during hydration.
 *
 * The subscription uses the `skipFirst` guard because nanostores fires
 * the listener IMMEDIATELY with the current value. Without it, an empty
 * store (e.g. in a test where `initFavorites` is mocked) would clobber
 * the just-set state with `[]`.
 *
 * Use this anywhere you need to read or render favorites in the UI. If you
 * only need to mutate the store from an event handler, you don't need this
 * hook — import `toggleFavorite` / `addFavorite` / `removeFavorite` directly.
 */
export function useFavorites(): readonly Favorite[] {
	// Initialise from localStorage — on the server (SSR) this returns `[]`;
	// on client-side re-mounts (e.g. view transitions) it returns the real
	// data for a correct first paint. The effect below then re-renders after
	// mount to fix SVG attributes that Preact doesn't update during hydration.
	const [favorites, setFavorites] = useState<readonly Favorite[]>(
		() => readFavoritesFromStorage(),
	);
	useEffect(() => {
		// Idempotent: populates the store from localStorage on first call only.
		initFavorites();
		// Read from the store, which `initFavorites` just hydrated from
		// localStorage. Using the store instead of calling
		// `readFavoritesFromStorage` directly avoids a redundant read +
		// validate + migrate cycle — `initFavorites` already handled that.
		setFavorites([...$favorites.get()]);
		// nanostores' `subscribe()` fires the listener IMMEDIATELY with the
		// current value of the atom. If we don't skip that first call, it
		// would re-set state to the same value we just set above (a no-op
		// in the common case, but a `[]`-clobber in tests where `initFavorites`
		// was mocked). Skipping it means the subscription only handles
		// future changes.
		let skipFirst = true;
		return $favorites.subscribe((next) => {
			if (skipFirst) {
				skipFirst = false;
				return;
			}
			setFavorites(next);
		});
	}, []);
	return favorites;
}
