import { useState, useRef, useEffect } from "preact/hooks";
import IconMap from "./IconMap";
import IconChevronDown from "./IconChevronDown";
import { defaultCines } from "@/lib/constants";
import type { Cine } from "@/lib/types";
import { cineStore, setCine } from "@/stores/cineStore";
import { useStore } from "@nanostores/preact"

type NavDropdownProps = {
  onSelect?: (cine: Cine) => void;
};

export default function NavDropdown({ onSelect }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const $cineStore = useStore(cineStore)
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function handleSelect(cine: Cine) {
    setOpen(false);
    setCine(cine);
    if (onSelect) onSelect(cine);
  }

  return (
    <div class="relative" ref={dropdownRef}>
      <button
        type="button"
        class="flex justify-between items-center w-52 bg-gray-800 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <IconMap size="20" />
        <span class={$cineStore.value === "" ? "text-gray-400" : ""}>
          {$cineStore.label}
        </span>
        <IconChevronDown />
      </button>
      {open && (
        <ul
          class="absolute left-0 w-full mt-2 bg-gray-900 rounded shadow-lg z-10 border border-gray-700"
          role="listbox"
        >
          {defaultCines.map((cine) => (
            <li
              key={cine.value}
              class={`px-4 py-2 cursor-pointer hover:bg-red-400 hover:text-black ${
                cine.value === $cineStore.value ? "bg-red-400 text-black" : ""
              }`}
              role="option"
              aria-selected={cine.value === $cineStore.value}
              onClick={() => handleSelect(cine)}
            >
              {cine.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
