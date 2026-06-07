import { useState, useRef, useEffect, useLayoutEffect } from "preact/hooks";
import IconMap from "./IconMap";
import IconChevronDown from "./IconChevronDown";
import { defaultCines } from "@/lib/constants";
import type { Cine } from "@/lib/types";

// Cookie helpers
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function NavDropdown() {
  const [open, setOpen] = useState(false);
  const [cine, setCine] = useState<Cine>(defaultCines[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set cinema from cookie on component mount
  useEffect(() => {
    const savedCineValue = getCookie("selectedCine");
    if (savedCineValue) {
      const matchedCine = defaultCines.find((c) => c.value === savedCineValue);
      if (matchedCine) {
        setCine(matchedCine);
      }
    }
  }, []);

  // Close dropdown if clicking outside
  // useLayoutEffect (not useEffect) so the listener is registered in the same
  // frame the menu opens. useEffect schedules via requestAnimationFrame which
  // can race with the next test/user click in jsdom (and is imperceptible to
  // real users either way — the listener is active before any paint).
  useLayoutEffect(() => {
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

  function handleSelect(selected: Cine) {
    setOpen(false);
    if (selected.value === cine.value) return;
    setCine(selected);
    // Persist preference as a cookie (1 year, readable by server middleware)
    setCookie("selectedCine", selected.value);
    const cineChangeEvent = new CustomEvent("cineChange", {
      detail: { value: selected.value },
      bubbles: true,
      composed: true,
    });
    dropdownRef.current?.dispatchEvent(cineChangeEvent);
  }

  return (
    <div class="relative" ref={dropdownRef}>
      <button
        type="button"
        class="flex justify-between items-center w-full sm:w-52 bg-gray-800 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <IconMap size="20" />
        <span class={cine.value === "" ? "text-gray-400" : ""}>
          {cine.label}
        </span>
        <IconChevronDown />
      </button>
      {open && (
        <ul
          class="absolute left-0 w-full mt-2 bg-gray-900 rounded shadow-lg z-10 border border-gray-700"
          role="listbox"
        >
          {defaultCines.map((item) => {
            const isDisabled = item.value !== "huajuapan";
            return (
              <li
                key={item.value}
                class={`px-4 py-2 flex justify-between items-center 
                        ${item.value === cine.value ? "bg-red-400 text-black" : ""} 
                        ${isDisabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer hover:bg-red-400 hover:text-black"}`}
                role="option"
                aria-selected={item.value === cine.value}
                onClick={() => !isDisabled && handleSelect(item)}
              >
                <span>{item.label}</span>
                {isDisabled && (
                  <span class="text-[8px] uppercase font-bold bg-gray-500 text-white px-1.5 py-0.5 rounded-full ml-2">
                    Próximamente
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
