import { render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import FavoritesList from "../FavoritesList";
import { $favorites, clearFavorites } from "@/lib/stores/favorites";

beforeEach(() => {
	clearFavorites();
	localStorage.clear();

	// Override global.fetch to return empty arrays so the component does
	// not attempt real HTTP requests during tests. Each cine gets an empty
	// movie list, which means all favorites render as "No disponible" cards
	// — enough to test the clear-all button.
	global.fetch = vi.fn(() =>
		Promise.resolve({
			ok: true,
			status: 200,
			json: () => Promise.resolve([]),
		}),
	) as any;
});

describe("FavoritesList clear-all button", () => {
	it("is hidden when there are no favorites", () => {
		render(<FavoritesList />);
		expect(
			screen.queryByTestId("clear-all-favorites"),
		).not.toBeInTheDocument();
	});

	it("is hidden while cines are loading", async () => {
		// Collect all deferred resolves so we can keep the fetch pending,
		// assert the button is hidden during loading, then resolve all.
		const resolves: Array<(v: unknown) => void> = [];
		global.fetch = vi.fn(
			() =>
				new Promise((resolve) => {
					resolves.push(resolve);
				}),
		) as any;

		$favorites.set([
			{ cine: "huajuapan", movieId: "1", addedAt: 1 },
			{ cine: "lagos", movieId: "2", addedAt: 2 },
		]);
		render(<FavoritesList />);

		// Wait for the component to process the render + useEffect
		// (loading state is set synchronously via setState in the effect).
		await vi.waitFor(() => {
			expect(
				screen.queryByTestId("clear-all-favorites"),
			).not.toBeInTheDocument();
		});

		// Resolve ALL pending fetches with empty movie lists
		for (const r of resolves) {
			r({
				ok: true,
				status: 200,
				json: () => Promise.resolve([]),
			});
		}

		await waitFor(() => {
			expect(
				screen.getByTestId("clear-all-favorites"),
			).toBeInTheDocument();
		});
	});

	it("appears when there are favorites", async () => {
		$favorites.set([{ cine: "huajuapan", movieId: "1", addedAt: 1 }]);
		render(<FavoritesList />);

		await waitFor(() => {
			expect(
				screen.getByTestId("clear-all-favorites"),
			).toBeInTheDocument();
		});
	});

	it("clears all favorites on confirm", async () => {
		const user = userEvent.setup();
		vi.spyOn(window, "confirm").mockReturnValue(true);

		$favorites.set([
			{ cine: "huajuapan", movieId: "1", addedAt: 1 },
			{ cine: "lagos", movieId: "2", addedAt: 2 },
		]);
		render(<FavoritesList />);

		await waitFor(() => {
			expect(
				screen.getByTestId("clear-all-favorites"),
			).toBeInTheDocument();
		});

		await user.click(screen.getByTestId("clear-all-favorites"));

		expect($favorites.get()).toEqual([]);
		expect(window.confirm).toHaveBeenCalledWith(
			"¿Borrar todas las películas de favoritos?",
		);
	});

	it("does nothing when confirm is cancelled", async () => {
		const user = userEvent.setup();
		vi.spyOn(window, "confirm").mockReturnValue(false);

		$favorites.set([
			{ cine: "huajuapan", movieId: "1", addedAt: 1 },
			{ cine: "lagos", movieId: "2", addedAt: 2 },
		]);
		render(<FavoritesList />);

		await waitFor(() => {
			expect(
				screen.getByTestId("clear-all-favorites"),
			).toBeInTheDocument();
		});

		await user.click(screen.getByTestId("clear-all-favorites"));

		expect($favorites.get()).toHaveLength(2);
	});
});
