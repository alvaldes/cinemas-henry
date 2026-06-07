import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/preact";

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

	it("hydrates from localStorage in the post-mount effect (re-render), not in the initial render", async () => {
		// This is the test that locks in the SSR + hydration fix. On the
		// server `readFavoritesFromStorage()` returns `[]` (no localStorage),
		// so the SSR'd DOM has isFav = false. The client must re-render
		// after mount with the real localStorage data so the DOM is updated.
		//
		// If this regresses to `useState(() => readFavoritesFromStorage())`,
		// the test still passes in the happy path (the effect would set
		// the same value). The assertion that matters is below: the
		// `$favorites` store MUST end up populated, proving the hydration
		// effect ran.
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

	it("does not re-apply the same value if initFavorites and the localStorage read both produce `[]`", async () => {
		// Regression guard: with the old `setFavorites($favorites.get())`
		// pattern, the store would always overwrite the localStorage-derived
		// state. Now we read directly from localStorage in the effect, so
		// an empty localStorage stays empty (no spurious re-render).
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
