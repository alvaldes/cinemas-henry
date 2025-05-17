import { useState, useRef, useEffect } from "preact/hooks";
import IconMap from "./IconMap";
import IconChevronDown from "./IconChevronDown";

type Cine = {
  value: string;
  label: string;
};

const cines: Cine[] = [
  { value: "", label: "Seleccionar cine" },
  { value: "lagos", label: "LAGOS" },
  { value: "juchitan", label: "JUCHITAN" },
  { value: "huajuapan", label: "HUAJUAPAN" },
];

type NavDropdownProps = {
  onSelect?: (cine: Cine) => void;
};

export default function NavDropdown({ onSelect }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Cine>(cines[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cierra el dropdown si hacés click fuera
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
    setSelected(cine);
    setOpen(false);
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
        <span class={selected.value === "" ? "text-gray-400" : ""}>
          {selected.label}
        </span>
        <IconChevronDown />
      </button>
      {open && (
        <ul
          class="absolute left-0 w-full mt-2 bg-gray-900 rounded shadow-lg z-10 border border-gray-700"
          role="listbox"
        >
          {cines.map((cine) => (
            <li
              key={cine.value}
              class={`px-4 py-2 cursor-pointer hover:bg-red-400 hover:text-black ${
                cine.value === selected.value ? "bg-red-400 text-black" : ""
              }`}
              role="option"
              aria-selected={cine.value === selected.value}
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
