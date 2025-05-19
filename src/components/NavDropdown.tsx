import { useState, useRef, useEffect } from "preact/hooks";
import IconMap from "./IconMap";
import IconChevronDown from "./IconChevronDown";

type Cine = {
  value: string;
  label: string;
  url: string;
};

const defaultCines: Cine[] = [
  {
    value: "",
    label: "Seleccionar cine",
    url: "",
  },
  {
    value: "Lagos",
    label: "Lagos",
    url: "http://cnbxlagos.dyndns.org/",
  },
  {
    value: "Juchitan",
    label: "Juchitan",
    url: "http://cnbxjuchitan.dyndns.org/",
  },
  {
    value: "Huajuapan",
    label: "Huajuapan",
    url: "http://cnbxhuajuapan.dyndns.org/",
  },
];

type NavDropdownProps = {
  onSelect?: (cine: Cine) => void;
};

export default function NavDropdown({ onSelect }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Cine>(defaultCines[0]);
  const [cines, setCines] = useState<Cine[]>(defaultCines);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cines from API
  // CORS problem on localhost
  useEffect(() => {
    async function fetchCines() {
      try {
        const response = await fetch(
          "https://www.cinemashenry.com.mx/api/complejos/328",
          {
            headers: {
              Accept: "application/json, text/javascript, */*; q=0.01",
              "X-Requested-With": "XMLHttpRequest",
            },
          },
        );
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Fetched cines:", data);
        const fetchedCines = data.configTv.map((cine: any) => ({
          value: cine.referencia.toLowerCase().replace(" ", "-"),
          label: cine.nombre,
        }));
        setCines([defaultCines[0], ...fetchedCines]);
      } catch (error) {
        console.error("Error fetching cines:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCines();
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
          {loading ? (
            <li class="px-4 py-2 text-gray-400">Cargando...</li>
          ) : (
            cines.map((cine) => (
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
            ))
          )}
        </ul>
      )}
    </div>
  );
}
