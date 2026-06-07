import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/preact";
import type { Favorite } from "@/lib/stores/favorites";

const STORAGE_KEY = "cinemas-henry:favorites";

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
	// Fresh module per test → fresh `$favorites` atom and fresh `hydrated`
	// flag. Without this, the first test would set `hydrated = true` and
	// every subsequent test that exercises the hydration path would be
	// silently short-circuited.
	vi.resetModules();
});

describe("useFavorites()", () => {
	it("returns an empty list when localStorage is empty", async () => {
		const { useFavorites } = await import("../hooks/useFavorites");
		const { result } = renderHook(() => useFavorites());
		expect(result.current).toEqual([]);
	});

	it("returns an empty list when localStorage contains a corrupted payload", async () => {
		localStorage.setItem(STORAGE_KEY, "}{invalid json");
		const { useFavorites } = await import("../hooks/useFavorites");
		const { result } = renderHook(() => useFavorites());
		expect(result.current).toEqual([]);
	});

	it("hydrates from localStorage in the post-mount effect (store hydration)", async () => {
		// The key assertion is that the effect runs `initFavorites()` which
		// populates the nanostores `$favorites` store — this is what makes
		// the /watchlist page work and keeps the store in sync with the UI.
		//
		// On the first render, `useState(() => readFavoritesFromStorage())`
		// already returns the localStorage data (see the "first render" test
		// below). The effect's `setFavorites(...)` is then a re-render that
		// fixes SVG attributes that Preact doesn't diff during hydration.
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify([{ cine: "huajuapan", movieId: "1", addedAt: 1 }]),
		);

		const { useFavorites } = await import("../hooks/useFavorites");
		const favoritesStore = await import("../stores/favorites");

		const { result } = renderHook(() => useFavorites());

		// After mount + effect, the state reflects localStorage.
		expect(result.current).toHaveLength(1);
		expect(result.current[0]).toEqual({
			cine: "huajuapan",
			movieId: "1",
			addedAt: 1,
		});
		// And the store was hydrated too (this is what makes the
		// /watchlist page work on first navigation, etc).
		expect(favoritesStore.$favorites.get()).toHaveLength(1);
	});

	it("reads from localStorage on the first render (client-side)", async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify([{ cine: "huajuapan", movieId: "1", addedAt: 1 }]),
		);

		// Capture every render value to inspect the very first one.
		const renders: readonly Favorite[][] = [];
		const { useFavorites } = await import("../hooks/useFavorites");

		renderHook(() => {
			const favs = useFavorites();
			renders.push(favs);
			return favs;
		});

		// The useState(() => readFavoritesFromStorage()) initializer gives
		// us the localStorage data on the very first render (client-side).
		expect(renders[0]).toHaveLength(1);
		expect(renders[0][0]).toEqual({
			cine: "huajuapan",
			movieId: "1",
			addedAt: 1,
		});
	});

	it("does not re-apply the same value if initFavorites and the store both produce `[]`", async () => {
		// Regression guard: we read from `$favorites.get()` (which
		// `initFavorites` just populated) instead of calling
		// `readFavoritesFromStorage` a second time. An empty store stays
		// empty (no spurious re-render on mount).
		const { useFavorites } = await import("../hooks/useFavorites");
		const { result, rerender } = renderHook(() => useFavorites());
		expect(result.current).toEqual([]);

		// Trigger a re-render with the same hook. Should be a no-op.
		rerender();
		expect(result.current).toEqual([]);
	});

	it("reflects mutations via the nanostores subscription", async () => {
		const { useFavorites } = await import("../hooks/useFavorites");
		const { addFavorite, isFavorite } = await import("../stores/favorites");

		const { result } = renderHook(() => useFavorites());
		expect(result.current).toEqual([]);

		act(() => {
			addFavorite("huajuapan", "1");
		});

		expect(result.current).toHaveLength(1);
		expect(result.current[0].cine).toBe("huajuapan");
		expect(result.current[0].movieId).toBe("1");
		expect(isFavorite("huajuapan", "1")).toBe(true);
	});

	it("reflects mutations triggered by store calls happening between mount and first effect flush", async () => {
		// Edge case: the favorite button is clicked during the brief window
		// between the hook mounting and the effect running. The hook should
		// pick up the mutation on the next render via the subscription.
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify([{ cine: "huajuapan", movieId: "1", addedAt: 1 }]),
		);
		const { useFavorites } = await import("../hooks/useFavorites");
		const { addFavorite, removeFavorite } = await import(
			"../stores/favorites"
		);

		const { result } = renderHook(() => useFavorites());
		expect(result.current).toHaveLength(1);

		// Simulate an external toggle
		act(() => {
			removeFavorite("huajuapan", "1");
		});
		expect(result.current).toEqual([]);

		act(() => {
			addFavorite("huajuapan", "1");
		});
		expect(result.current).toHaveLength(1);
	});
});
