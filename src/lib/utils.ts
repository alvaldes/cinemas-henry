import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate today's date in DD/MM/YYYY format
export const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split("/").map(Number); // Divide y convierte a números
  return new Date(year, month - 1, day); // Crea un objeto Date (meses son 0-indexados)
};

export const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0); // Ajusta al inicio del día
  return normalized;
};
