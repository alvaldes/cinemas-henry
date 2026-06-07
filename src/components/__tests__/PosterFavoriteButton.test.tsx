import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import PosterFavoriteButton from "../PosterFavoriteButton";
import { $favorites, clearFavorites } from "@/lib/stores/favorites";

beforeEach(() => {
	clearFavorites();
	localStorage.clear();
});

describe("PosterFavoriteButton", () => {
	it("renders a real <button> with the 'add' aria-label when not favorited", () => {
		render(<PosterFavoriteButton cine="huajuapan" movieId="42" />);
		const button = screen.getByRole("button");
		expect(button.tagName).toBe("BUTTON");
		expect(button.getAttribute("type")).toBe("button");
		expect(button.getAttribute("aria-pressed")).toBe("false");
		expect(button.getAttribute("aria-label")).toBe("Añadir a favoritos");
	});

	it("renders the 'remove' aria-label when already favorited", () => {
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		render(<PosterFavoriteButton cine="huajuapan" movieId="42" />);
		const button = screen.getByRole("button");
		expect(button.getAttribute("aria-pressed")).toBe("true");
		expect(button.getAttribute("aria-label")).toBe("Quitar de favoritos");
	});

	it("toggles the favorite state on click", async () => {
		const user = userEvent.setup();
		render(<PosterFavoriteButton cine="huajuapan" movieId="42" />);
		const button = screen.getByRole("button");

		expect($favorites.get()).toHaveLength(0);
		expect(button.getAttribute("aria-pressed")).toBe("false");

		await user.click(button);
		expect($favorites.get()).toHaveLength(1);
		expect($favorites.get()[0]).toMatchObject({
			cine: "huajuapan",
			movieId: "42",
		});
		expect(button.getAttribute("aria-pressed")).toBe("true");

		await user.click(button);
		expect($favorites.get()).toHaveLength(0);
		expect(button.getAttribute("aria-pressed")).toBe("false");
	});

	it("stops click propagation so the underlying poster link does not fire", async () => {
		const user = userEvent.setup();
		const onLinkClick = vi.fn();
		render(
			<a href="/x" onClick={onLinkClick}>
				<PosterFavoriteButton cine="huajuapan" movieId="42" />
			</a>,
		);
		const button = screen.getByRole("button");
		await user.click(button);
		expect(onLinkClick).not.toHaveBeenCalled();
		expect($favorites.get()).toHaveLength(1);
	});

	it("uses a stable testid that encodes cine and movieId", () => {
		render(<PosterFavoriteButton cine="huajuapan" movieId="42" />);
		expect(
			screen.getByTestId("poster-fav-huajuapan-42"),
		).toBeInTheDocument();
	});

	it("treats the same movieId in different cines as independent", () => {
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		const { rerender } = render(
			<PosterFavoriteButton cine="huajuapan" movieId="42" />,
		);
		expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
			"true",
		);

		rerender(<PosterFavoriteButton cine="lagos" movieId="42" />);
		expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
			"false",
		);
	});

	it("renders the bookmark icon with no fill when not favorited", () => {
		const { container } = render(
			<PosterFavoriteButton cine="huajuapan" movieId="42" />,
		);
		const svg = container.querySelector("svg");
		expect(svg).toBeTruthy();
		expect(svg?.getAttribute("fill")).toBe("none");
		// Sanity: the lucide bookmark glyph is present
		expect(svg?.querySelector("path")?.getAttribute("d")).toContain(
			"m19 21",
		);
	});

	it("renders the bookmark icon filled with yellow when favorited", () => {
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		const { container } = render(
			<PosterFavoriteButton cine="huajuapan" movieId="42" />,
		);
		const svg = container.querySelector("svg");
		expect(svg).toBeTruthy();
		expect(svg?.getAttribute("fill")).toBe("#facc15");
	});
});
