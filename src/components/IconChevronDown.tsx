import type { JSX } from "preact";

type IconProps = JSX.SVGAttributes<SVGSVGElement> & {
  size?: string;
  color?: string;
};

export default function IconChevronDown({
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
      class="lucide lucide-chevron-down-icon lucide-chevron-down"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
