import type { JSX } from "preact";

type IconProps = JSX.SVGAttributes<SVGSVGElement> & {
	size?: string;
	color?: string;
};

/**
 * Inline SVG icon for the lucide `trash2` glyph. Matches the style of
 * `IconBookmark.tsx` / `IconMap.tsx` so we keep a single source of truth
 * for icon styling across Preact islands.
 */
export default function IconTrash2({
	size = "24",
	color = "currentColor",
	...props
}: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="lucide lucide-trash2-icon lucide-trash2"
			{...props}
		>
			<path d="M3 6h18" />
			<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
			<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
			<line x1="10" y1="11" x2="10" y2="17" />
			<line x1="14" y1="11" x2="14" y2="17" />
		</svg>
	);
}
