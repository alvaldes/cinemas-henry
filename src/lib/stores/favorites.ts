import { atom, type WritableAtom } from "nanostores";

/**
 * A single favorite entry. We only store identifiers (cine + movieId) and a
 * timestamp, never the full movie payload — the data on the API is the source
 * of truth and we re-fetch on demand. Keeping payloads small also keeps
 * localStorage clean across many devices.
 */
export type Favorite = {
	cine: string;
	movieId: string;
	addedAt: number;
};

/**
 * Reactive store holding the list of favorites.
 *
 * SSR contract: the atom is created with an empty list on both server and
 * client. localStorage is NEVER read at module load time (that would crash on
 * the server). Instead, `initFavorites()` must be called on the client to
 * hydrate the store. The store also subscribes to itself and writes any
 * change to localStorage automatically.
 */
export const $favorites: WritableAtom<Favorite[]> = atom<Favorite[]>([]);

export const FAVORITES_STORAGE_KEY = "cinemas-henry:favorites";

/** Builds the composite key used to identify a favorite across cines. */
export function favoritesKey(cine: string, movieId: string): string {
	return `${cine}:${movieId}`;
}

/** Pure read: is this movie in the current favorites list? */
export function isFavorite(cine: string, movieId: string): boolean {
	return $favorites
		.get()
		.some((f) => f.cine === cine && f.movieId === movieId);
}

/** Adds a favorite if it isn't already there. No-op when already present. */
export function addFavorite(cine: string, movieId: string): void {
	const list = $favorites.get();
	if (list.some((f) => f.cine === cine && f.movieId === movieId)) return;
	$favorites.set([...list, { cine, movieId, addedAt: Date.now() }]);
}

/** Removes a favorite. No-op when not present. */
export function removeFavorite(cine: string, movieId: string): void {
	$favorites.set(
		$favorites
			.get()
			.filter((f) => !(f.cine === cine && f.movieId === movieId)),
	);
}

/**
 * Toggles the favorite state.
 * @returns The new state: `true` if it was added, `false` if removed.
 */
export function toggleFavorite(cine: string, movieId: string): boolean {
	if (isFavorite(cine, movieId)) {
		removeFavorite(cine, movieId);
		return false;
	}
	addFavorite(cine, movieId);
	return true;
}

/** Wipes all favorites. Useful for tests and a future "clear all" UI. */
export function clearFavorites(): void {
	$favorites.set([]);
}

/** Group favorites by cine, preserving insertion order. */
export function groupFavoritesByCine(
	list: readonly Favorite[],
): Array<{ cine: string; items: Favorite[] }> {
	const order: string[] = [];
	const map = new Map<string, Favorite[]>();
	for (const fav of list) {
		if (!map.has(fav.cine)) {
			map.set(fav.cine, []);
			order.push(fav.cine);
		}
		map.get(fav.cine)!.push(fav);
	}
	return order.map((cine) => ({ cine, items: map.get(cine)! }));
}

// ---------------------------------------------------------------------------
// Persistence (client-side only)
// ---------------------------------------------------------------------------

const isBrowser =
	typeof window !== "undefined" && typeof localStorage !== "undefined";

/**
 * Reads, validates and migrates the favorites list straight from localStorage.
 *
 * Exposed (not just an implementation detail of `initFavorites`) because the
 * `useFavorites` hook needs to seed its first-render state synchronously —
 * before the `useEffect` that calls `initFavorites()` has a chance to run.
 * This is what prevents the "all markers show as not favorited" flash on
 * page load and on Astro View Transition re-mounts.
 *
 * Returns `[]` in SSR or when localStorage is missing / corrupt. Never throws.
 */
export function readFavoritesFromStorage(): readonly Favorite[] {
	if (!isBrowser) return [];
	try {
		const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		// Defensive shape validation — corrupted localStorage shouldn't crash the app
		const valid: Favorite[] = parsed.filter(
			(f: unknown): f is Favorite =>
				typeof f === "object" &&
				f !== null &&
				typeof (f as Favorite).cine === "string" &&
				typeof (f as Favorite).movieId === "string" &&
				typeof (f as Favorite).addedAt === "number",
		);
		// Migration: strip leading slashes from `cine` (caused by a buggy URL
		// extraction in NowPlaying.astro that produced "/huajuapan" instead of
		// "huajuapan"). Run on every read so users who marked favorites before
		// the fix don't end up with orphaned entries under a different key.
		// Dedupe by (cine, movieId) afterwards in case the same movie was saved
		// under both keys.
		const seen = new Set<string>();
		const migrated: Favorite[] = [];
		for (const f of valid) {
			const cine = f.cine.replace(/^\/+/, "");
			const key = favoritesKey(cine, f.movieId);
			if (seen.has(key)) continue;
			seen.add(key);
			migrated.push({ ...f, cine });
		}
		return migrated;
	} catch (err) {
		console.warn("[favorites] failed to read from localStorage:", err);
		return [];
	}
}

/**
 * Hydrates the store from localStorage. Safe to call multiple times: it's a
 * no-op after the first successful read. MUST be called from a client-side
 * effect (never at module top level — that would break SSR).
 */
let hydrated = false;
export function initFavorites(): void {
	if (hydrated || !isBrowser) return;
	hydrated = true;
	const migrated = readFavoritesFromStorage();
	// Only push to the store when there's something to push — avoids an
	// unnecessary `[]`-overwrite round trip through localStorage (and the
	// extra write it would trigger via the auto-persistence subscription).
	if (migrated.length > 0) {
		$favorites.set([...migrated]);
	}
}

// Auto-persist on every change, but only on the client.
//
// IMPORTANT: nanostores' `subscribe()` fires the listener IMMEDIATELY with
// the current value of the atom. If we don't skip that first call, the
// initial `[]` would overwrite whatever was already in localStorage the
// moment the module is evaluated — which would clobber re-hydration on
// module re-import (e.g. HMR) and breaks the "hydrate from disk" round
// trip. Skipping the first call makes persistence strictly reactive.
if (isBrowser) {
	let skipFirst = true;
	$favorites.subscribe((list) => {
		if (skipFirst) {
			skipFirst = false;
			return;
		}
		try {
			localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
		} catch (err) {
			console.warn("[favorites] failed to persist to localStorage:", err);
		}
	});
}
