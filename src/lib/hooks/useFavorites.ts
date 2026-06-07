import { useEffect, useState } from "preact/hooks";
import {
	$favorites,
	initFavorites,
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
 * Why the state is initialized to `[]` and not to `readFavoritesFromStorage()`:
 *
 * Naively seeding the state with a localStorage read works in a client-only
 * render, but breaks under Astro's SSR + hydration. With `client:load`,
 * Astro renders the component on the server (where localStorage is
 * undefined, so the helper returns `[]` → state starts empty) and then
 * hydrates on the client. During hydration Preact reuses the server's
 * `[]` state — it does NOT re-run the initializer — and crucially, it
 * does NOT re-apply SVG attribute changes from the new render onto the
 * server-rendered DOM. The result: the JSX is correct (`isFav = true`,
 * `ribbonFill = "#facc15"`) but the DOM keeps the server's `fill="#000000"`.
 * The component looks un-favorited even though the data says otherwise.
 *
 * Initializing to `[]` and then `setFavorites(readFavoritesFromStorage())`
 * inside the effect forces a re-render AFTER mount. The re-render produces
 * a fresh virtual DOM, Preact diffs it against the current DOM, and the
 * SVG attributes get updated correctly. The user sees a one-frame flash
 * of "not favorited" on first paint — invisible in practice — instead of
 * a permanent stale state.
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
	// Start empty to match the SSR render. The effect below hydrates from
	// localStorage and triggers a re-render with the real data. This avoids
	// the SSR + hydration SVG-attribute-staleness bug.
	const [favorites, setFavorites] = useState<readonly Favorite[]>([]);
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
