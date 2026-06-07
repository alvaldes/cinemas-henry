import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import FavoriteButton from "../FavoriteButton";
import { $favorites, clearFavorites } from "@/lib/stores/favorites";

beforeEach(() => {
	clearFavorites();
	localStorage.clear();
});

describe("FavoriteButton", () => {
	it("renders the 'add' label when the movie is not favorited", () => {
		render(<FavoriteButton cine="huajuapan" movieId="42" />);
		const button = screen.getByRole("button");
		expect(button.textContent).toContain("Añadir a Favoritos");
		expect(button.getAttribute("aria-pressed")).toBe("false");
		expect(button.getAttribute("aria-label")).toBe("Añadir a favoritos");
	});

	it("renders the 'favorited' label when the movie is already a favorite", () => {
		// Seed the store before mounting
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		render(<FavoriteButton cine="huajuapan" movieId="42" />);
		const button = screen.getByRole("button");
		expect(button.textContent).toContain("En favoritos");
		expect(button.getAttribute("aria-pressed")).toBe("true");
		expect(button.getAttribute("aria-label")).toBe("Quitar de favoritos");
	});

	it("toggles the favorite state on click", async () => {
		const user = userEvent.setup();
		render(<FavoriteButton cine="huajuapan" movieId="42" />);

		const button = screen.getByRole("button");
		expect(button.textContent).toContain("Añadir a Favoritos");
		expect($favorites.get()).toHaveLength(0);

		await user.click(button);
		expect($favorites.get()).toHaveLength(1);
		expect($favorites.get()[0]).toMatchObject({
			cine: "huajuapan",
			movieId: "42",
		});
		expect(button.textContent).toContain("En favoritos");

		await user.click(button);
		expect($favorites.get()).toHaveLength(0);
		expect(button.textContent).toContain("Añadir a Favoritos");
	});

	it("does not add duplicates if clicked twice without re-render", async () => {
		const user = userEvent.setup();
		// Start already favorited
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		render(<FavoriteButton cine="huajuapan" movieId="42" />);

		const button = screen.getByRole("button");

		await user.click(button); // removes
		expect($favorites.get()).toHaveLength(0);

		await user.click(button); // adds
		expect($favorites.get()).toHaveLength(1);

		await user.click(button); // removes
		expect($favorites.get()).toHaveLength(0);
	});

	it("treats the same movieId in different cines as independent", () => {
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		const { rerender } = render(
			<FavoriteButton cine="huajuapan" movieId="42" />,
		);
		expect(screen.getByRole("button").textContent).toContain("En favoritos");

		rerender(<FavoriteButton cine="lagos" movieId="42" />);
		expect(screen.getByRole("button").textContent).toContain(
			"Añadir a Favoritos",
		);
	});
});
