import { useState, useRef, useEffect } from "preact/hooks";
import IconMap from "./IconMap";
import IconChevronDown from "./IconChevronDown";
import { defaultCines } from "@/lib/constants";
import type { Cine } from "@/lib/types";

export default function NavDropdown() {
  const [open, setOpen] = useState(false);
  const [cine, setCine] = useState<Cine>(defaultCines[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set cinema from local storage on component mount
  useEffect(() => {
    try {
      const savedCine = localStorage.getItem('selectedCine');
      if (savedCine) {
        const parsedCine = JSON.parse(savedCine);
        setCine(parsedCine);
      }
    } catch (error) {
      console.error("Error reading from localStorage", error);
    }
  }, []);

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

  function handleSelect(selected: Cine) {
    setOpen(false);
    if (selected.value === cine.value) return;
    setCine(selected);
    try {
      localStorage.setItem('selectedCine', JSON.stringify(selected));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
    const cineChangeEvent = new CustomEvent('cineChange', {
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
        class="flex justify-between items-center w-52 bg-gray-800 text-white rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-400"
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
          {defaultCines.map((item) => (
            <li
              key={item.value}
              class={`px-4 py-2 cursor-pointer hover:bg-red-400 hover:text-black ${
                item.value === cine.value ? "bg-red-400 text-black" : ""
              }`}
              role="option"
              aria-selected={item.value === cine.value}
              onClick={() => handleSelect(item)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
