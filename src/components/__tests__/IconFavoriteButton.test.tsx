import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import IconFavoriteButton from "../IconFavoriteButton";
import { $favorites, clearFavorites } from "@/lib/stores/favorites";

beforeEach(() => {
	clearFavorites();
	localStorage.clear();
});

describe("IconFavoriteButton", () => {
	it("renders a real <button> with the 'add' aria-label when not favorited", () => {
		render(<IconFavoriteButton cine="huajuapan" movieId="42" />);
		const button = screen.getByRole("button");
		expect(button.tagName).toBe("BUTTON");
		expect(button.getAttribute("aria-pressed")).toBe("false");
		expect(button.getAttribute("aria-label")).toBe("Añadir a favoritos");
		expect(button.getAttribute("type")).toBe("button");
	});

	it("renders the 'remove' aria-label when already favorited", () => {
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		render(<IconFavoriteButton cine="huajuapan" movieId="42" />);
		const button = screen.getByRole("button");
		expect(button.getAttribute("aria-pressed")).toBe("true");
		expect(button.getAttribute("aria-label")).toBe("Quitar de favoritos");
	});

	it("toggles the favorite state on click", async () => {
		const user = userEvent.setup();
		render(<IconFavoriteButton cine="huajuapan" movieId="42" />);
		const button = screen.getByRole("button");

		expect($favorites.get()).toHaveLength(0);
		expect(button.getAttribute("aria-pressed")).toBe("false");

		await user.click(button);
		expect($favorites.get()).toHaveLength(1);
		expect(button.getAttribute("aria-pressed")).toBe("true");

		await user.click(button);
		expect($favorites.get()).toHaveLength(0);
		expect(button.getAttribute("aria-pressed")).toBe("false");
	});

	it("stops click propagation so the underlying card link does not fire", async () => {
		const user = userEvent.setup();
		const onLinkClick = vi.fn();
		render(
			<a href="/x" onClick={onLinkClick}>
				<IconFavoriteButton cine="huajuapan" movieId="42" />
			</a>,
		);
		const button = screen.getByRole("button");
		await user.click(button);
		expect(onLinkClick).not.toHaveBeenCalled();
		expect($favorites.get()).toHaveLength(1);
	});

	it("uses a stable testid that encodes cine and movieId", () => {
		render(<IconFavoriteButton cine="huajuapan" movieId="42" />);
		expect(
			screen.getByTestId("icon-fav-huajuapan-42"),
		).toBeInTheDocument();
	});

	it("treats the same movieId in different cines as independent", () => {
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		const { rerender } = render(
			<IconFavoriteButton cine="huajuapan" movieId="42" />,
		);
		expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
			"true",
		);

		rerender(<IconFavoriteButton cine="lagos" movieId="42" />);
		expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
			"false",
		);
	});

	it("renders the lucide-plus icon when not favorited and a bookmark when favorited", () => {
		// Not favorited: the icon overlay SVG carries the lucide-plus class.
		// We avoid asserting on raw path data because the canonical lucide
		// glyphs use multiple `<path>` elements and we want this test to
		// survive minor visual tweaks.
		const { container, rerender } = render(
			<IconFavoriteButton cine="huajuapan" movieId="42" />,
		);
		const notFavSvg = container.querySelector("svg.lucide-plus");
		expect(notFavSvg).toBeTruthy();

		// Favorited: the lucide-plus class is gone, and the overlay is now
		// a single-path filled bookmark glyph (starts with the lucide
		// bookmark signature `m19 21`).
		$favorites.set([{ cine: "huajuapan", movieId: "42", addedAt: 1 }]);
		rerender(<IconFavoriteButton cine="huajuapan" movieId="42" />);
		expect(container.querySelector("svg.lucide-plus")).toBeNull();
		const favPath = container.querySelector("svg path")?.getAttribute("d");
		expect(favPath).toContain("m19 21");
	});
});
