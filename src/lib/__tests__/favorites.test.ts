import { describe, it, expect, beforeEach } from "vitest";
import {
	$favorites,
	addFavorite,
	clearFavorites,
	favoritesKey,
	groupFavoritesByCine,
	initFavorites,
	isFavorite,
	readFavoritesFromStorage,
	removeFavorite,
	toggleFavorite,
	FAVORITES_STORAGE_KEY,
	type Favorite,
} from "../stores/favorites";

/**
 * The store module subscribes itself to localStorage at import time (only in
 * a browser-like environment, which jsdom qualifies as). Combined with the
 * `hydrated` guard inside `initFavorites`, this means:
 *  - The atom's value persists across tests as long as we don't reset it.
 *  - `initFavorites` only runs once per module load.
 *
 * The `beforeEach` below clears both the atom and the localStorage mock
 * (the global setup already clears localStorage after each test) so each
 * test starts from a known empty state.
 */
beforeEach(() => {
	clearFavorites();
	localStorage.clear();
});

describe("favoritesKey()", () => {
	it("composes cine and movieId with a colon", () => {
		expect(favoritesKey("huajuapan", "123")).toBe("huajuapan:123");
	});

	it("handles cine and movieId with special characters", () => {
		expect(favoritesKey("cine-uno", "peli-2")).toBe("cine-uno:peli-2");
	});
});

describe("isFavorite()", () => {
	it("returns false when the store is empty", () => {
		expect(isFavorite("huajuapan", "1")).toBe(false);
	});

	it("returns true after addFavorite for the same cine+id", () => {
		addFavorite("huajuapan", "1");
		expect(isFavorite("huajuapan", "1")).toBe(true);
	});

	it("treats the same movieId in different cines as different favorites", () => {
		addFavorite("huajuapan", "1");
		expect(isFavorite("lagos", "1")).toBe(false);
	});
});

describe("addFavorite()", () => {
	it("appends a new favorite with a timestamp", () => {
		const before = Date.now();
		addFavorite("huajuapan", "1");
		const after = Date.now();
		const list = $favorites.get();
		expect(list).toHaveLength(1);
		expect(list[0].cine).toBe("huajuapan");
		expect(list[0].movieId).toBe("1");
		expect(list[0].addedAt).toBeGreaterThanOrEqual(before);
		expect(list[0].addedAt).toBeLessThanOrEqual(after);
	});

	it("is idempotent — adding twice does not duplicate", () => {
		addFavorite("huajuapan", "1");
		addFavorite("huajuapan", "1");
		expect($favorites.get()).toHaveLength(1);
	});

	it("keeps multiple distinct favorites", () => {
		addFavorite("huajuapan", "1");
		addFavorite("huajuapan", "2");
		addFavorite("lagos", "1");
		expect($favorites.get()).toHaveLength(3);
	});
});

describe("removeFavorite()", () => {
	it("removes an existing favorite", () => {
		addFavorite("huajuapan", "1");
		addFavorite("huajuapan", "2");
		removeFavorite("huajuapan", "1");
		const list = $favorites.get();
		expect(list).toHaveLength(1);
		expect(list[0].movieId).toBe("2");
	});

	it("is a no-op when the favorite does not exist", () => {
		addFavorite("huajuapan", "1");
		removeFavorite("huajuapan", "nope");
		expect($favorites.get()).toHaveLength(1);
	});

	it("only removes the matching cine+id pair", () => {
		addFavorite("huajuapan", "1");
		addFavorite("lagos", "1");
		removeFavorite("huajuapan", "1");
		expect(isFavorite("lagos", "1")).toBe(true);
		expect(isFavorite("huajuapan", "1")).toBe(false);
	});
});

describe("toggleFavorite()", () => {
	it("adds when missing and returns true", () => {
		const result = toggleFavorite("huajuapan", "1");
		expect(result).toBe(true);
		expect(isFavorite("huajuapan", "1")).toBe(true);
	});

	it("removes when present and returns false", () => {
		addFavorite("huajuapan", "1");
		const result = toggleFavorite("huajuapan", "1");
		expect(result).toBe(false);
		expect(isFavorite("huajuapan", "1")).toBe(false);
	});
});

describe("clearFavorites()", () => {
	it("empties the store", () => {
		addFavorite("huajuapan", "1");
		addFavorite("lagos", "2");
		clearFavorites();
		expect($favorites.get()).toEqual([]);
	});
});

describe("groupFavoritesByCine()", () => {
	it("returns an empty array for empty input", () => {
		expect(groupFavoritesByCine([])).toEqual([]);
	});

	it("groups by cine and preserves insertion order", () => {
		const input: Favorite[] = [
			{ cine: "huajuapan", movieId: "1", addedAt: 1 },
			{ cine: "lagos", movieId: "1", addedAt: 2 },
			{ cine: "huajuapan", movieId: "2", addedAt: 3 },
		];
		const groups = groupFavoritesByCine(input);
		expect(groups).toHaveLength(2);
		expect(groups[0].cine).toBe("huajuapan");
		expect(groups[0].items.map((f) => f.movieId)).toEqual(["1", "2"]);
		expect(groups[1].cine).toBe("lagos");
		expect(groups[1].items).toHaveLength(1);
	});
});

describe("persistence", () => {
	it("writes to localStorage on every change", () => {
		addFavorite("huajuapan", "1");
		const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
		expect(stored).toBeTruthy();
		const parsed = JSON.parse(stored!);
		expect(parsed).toEqual([
			expect.objectContaining({ cine: "huajuapan", movieId: "1" }),
		]);
	});

	it("clears localStorage when all favorites are removed", () => {
		addFavorite("huajuapan", "1");
		clearFavorites();
		const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
		expect(stored).toBe("[]");
	});
});

describe("readFavoritesFromStorage()", () => {
	it("returns [] when localStorage is empty", () => {
		expect(readFavoritesFromStorage()).toEqual([]);
	});

	it("returns [] when localStorage contains invalid JSON", () => {
		localStorage.setItem(FAVORITES_STORAGE_KEY, "not valid json {");
		expect(readFavoritesFromStorage()).toEqual([]);
	});

	it("returns [] when localStorage contains a non-array payload", () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify({ oops: 1 }),
		);
		expect(readFavoritesFromStorage()).toEqual([]);
	});

	it("returns [] when localStorage contains a non-string JSON value", () => {
		// e.g. someone manually wrote `null` or a number to the key
		localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(null));
		expect(readFavoritesFromStorage()).toEqual([]);
	});

	it("reads a valid payload", () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([
				{ cine: "huajuapan", movieId: "1", addedAt: 1234 },
				{ cine: "lagos", movieId: "2", addedAt: 5678 },
			]),
		);
		const result = readFavoritesFromStorage();
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			cine: "huajuapan",
			movieId: "1",
			addedAt: 1234,
		});
	});

	it("filters out malformed entries without throwing", () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([
				{ cine: "huajuapan", movieId: "1", addedAt: 1 },
				{ cine: 42, movieId: "1", addedAt: 1 }, // cine not string
				null,
				"nope",
				{ cine: "lagos", movieId: "2" }, // missing addedAt
				{ cine: "lagos", movieId: "3", addedAt: 3 },
			]),
		);
		const result = readFavoritesFromStorage();
		expect(result).toHaveLength(2);
		expect(result.map((f) => f.cine).sort()).toEqual(["huajuapan", "lagos"]);
	});

	it("strips leading slashes from cine (migration on every read)", () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([{ cine: "/huajuapan", movieId: "1", addedAt: 1 }]),
		);
		const result = readFavoritesFromStorage();
		expect(result[0].cine).toBe("huajuapan");
	});

	it("dedupes when the same movie is saved under both /cine and cine", () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([
				{ cine: "/huajuapan", movieId: "1", addedAt: 1 },
				{ cine: "huajuapan", movieId: "1", addedAt: 2 },
			]),
		);
		expect(readFavoritesFromStorage()).toHaveLength(1);
	});

	it("does not mutate the global store (pure read)", () => {
		clearFavorites();
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([{ cine: "huajuapan", movieId: "1", addedAt: 1 }]),
		);
		readFavoritesFromStorage();
		// Store should still be empty — the helper is a pure read, not a
		// hydration step. (Hydration is initFavorites' job.)
		expect($favorites.get()).toEqual([]);
	});
});

describe("initFavorites()", () => {
	// Because `initFavorites` is guarded by a module-local `hydrated` flag, we
	// reset the module to get a fresh state and test re-hydration.
	it("hydrates the store from a valid localStorage payload", async () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([
				{ cine: "huajuapan", movieId: "1", addedAt: 1234 },
				{ cine: "lagos", movieId: "2", addedAt: 5678 },
			]),
		);

		// Fresh module → fresh `hydrated` flag.
		vi.resetModules();
		const fresh = await import("../stores/favorites");
		fresh.initFavorites();
		expect(fresh.$favorites.get()).toHaveLength(2);
		expect(fresh.isFavorite("huajuapan", "1")).toBe(true);
		expect(fresh.isFavorite("lagos", "2")).toBe(true);
	});

	it("filters out malformed entries without throwing", async () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([
				{ cine: "huajuapan", movieId: "1", addedAt: 1 },
				{ cine: 42, movieId: "1", addedAt: 1 }, // cine is not string
				null,
				"nope",
				{ cine: "lagos", movieId: "2" }, // missing addedAt
				{ cine: "lagos", movieId: "3", addedAt: 3 },
			]),
		);

		vi.resetModules();
		const fresh = await import("../stores/favorites");
		fresh.initFavorites();
		const list = fresh.$favorites.get();
		expect(list).toHaveLength(2);
		expect(list.map((f) => f.cine).sort()).toEqual(["huajuapan", "lagos"]);
	});

	it("does nothing when localStorage is empty", async () => {
		vi.resetModules();
		const fresh = await import("../stores/favorites");
		fresh.initFavorites();
		expect(fresh.$favorites.get()).toEqual([]);
	});

	it("does nothing when localStorage contains invalid JSON", async () => {
		localStorage.setItem(FAVORITES_STORAGE_KEY, "not valid json {");
		vi.resetModules();
		const fresh = await import("../stores/favorites");
		// Should not throw
		expect(() => fresh.initFavorites()).not.toThrow();
		expect(fresh.$favorites.get()).toEqual([]);
	});

	it("does nothing when localStorage contains a non-array payload", async () => {
		localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ oops: 1 }));
		vi.resetModules();
		const fresh = await import("../stores/favorites");
		fresh.initFavorites();
		expect(fresh.$favorites.get()).toEqual([]);
	});

	it("is idempotent across multiple calls", async () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([{ cine: "huajuapan", movieId: "1", addedAt: 1 }]),
		);
		vi.resetModules();
		const fresh = await import("../stores/favorites");
		fresh.initFavorites();
		fresh.initFavorites(); // second call should be a no-op
		expect(fresh.$favorites.get()).toHaveLength(1);
	});
});

describe("initFavorites() — migration: leading-slash cine cleanup", () => {
	// This migration handles a bug where NowPlaying.astro extracted the
	// cine as "/huajuapan" (with leading slash) while every other component
	// used "huajuapan", causing the same movie to be stored under two keys.

	it("strips leading slashes from cine values", async () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([
				{ cine: "/huajuapan", movieId: "1", addedAt: 1 },
				{ cine: "lagos", movieId: "2", addedAt: 2 },
			]),
		);
		vi.resetModules();
		const fresh = await import("../stores/favorites");
		fresh.initFavorites();
		const list = fresh.$favorites.get();
		expect(list).toHaveLength(2);
		// The slashed entry is now reachable under the normalized key
		expect(fresh.isFavorite("huajuapan", "1")).toBe(true);
		// And NOT under the old broken key
		expect(fresh.isFavorite("/huajuapan", "1")).toBe(false);
	});

	it("merges duplicates created by the same movie saved under both keys", async () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([
				{ cine: "/huajuapan", movieId: "1", addedAt: 1 },
				{ cine: "huajuapan", movieId: "1", addedAt: 2 }, // same movie, no slash
			]),
		);
		vi.resetModules();
		const fresh = await import("../stores/favorites");
		fresh.initFavorites();
		// Both entries collapse to one
		expect(fresh.$favorites.get()).toHaveLength(1);
		expect(fresh.isFavorite("huajuapan", "1")).toBe(true);
	});

	it("strips multiple leading slashes defensively", async () => {
		localStorage.setItem(
			FAVORITES_STORAGE_KEY,
			JSON.stringify([{ cine: "///huajuapan", movieId: "1", addedAt: 1 }]),
		);
		vi.resetModules();
		const fresh = await import("../stores/favorites");
		fresh.initFavorites();
		expect(fresh.isFavorite("huajuapan", "1")).toBe(true);
	});
});
