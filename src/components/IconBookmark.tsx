import type { JSX } from "preact";

type IconProps = JSX.SVGAttributes<SVGSVGElement> & {
	size?: string;
	color?: string;
	filled?: boolean;
};

/**
 * Inline SVG icon for the lucide `bookmark` glyph. Matches the style of
 * `IconMap.tsx` / `IconChevronDown.tsx` (inline SVG, currentColor strokes)
 * so we keep a single source of truth for icon styling across Preact islands.
 */
export default function IconBookmark({
	size = "24",
	color = "currentColor",
	filled = false,
	...props
}: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={filled ? color : "none"}
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="lucide lucide-bookmark-icon lucide-bookmark"
			{...props}
		>
			<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
		</svg>
	);
}
