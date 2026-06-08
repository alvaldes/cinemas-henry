/**
 * Search history stored in localStorage.
 *
 * Keeps the last N unique search queries per cine. No nanostore needed —
 * the search dropdown reads/writes localStorage directly via inline scripts.
 */

export const SEARCH_HISTORY_KEY = "cinemas-henry:search-history";
export const MAX_HISTORY = 10;

const isBrowser =
	typeof window !== "undefined" && typeof localStorage !== "undefined";

/** Read saved history. Never throws. */
export function readHistory(): Record<string, string[]> {
	if (!isBrowser) return {};
	try {
		const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
		if (!raw) return {};
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return {};
		return parsed as Record<string, string[]>;
	} catch {
		return {};
	}
}

/** Get history for a specific cine, most recent first. */
export function getHistoryForCine(cine: string): string[] {
	return readHistory()[cine] ?? [];
}

/** Save a query to history for the given cine. Deduplicates, caps at MAX. */
export function saveToHistory(cine: string, query: string): void {
	if (!query.trim()) return;
	const all = readHistory();
	const prev = all[cine] ?? [];
	const filtered = prev.filter((q) => q.toLowerCase() !== query.toLowerCase());
	all[cine] = [query, ...filtered].slice(0, MAX_HISTORY);
	try {
		localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(all));
	} catch {
		// localStorage full or unavailable — silently ignore
	}
}

/** Clear the full history for all cines. */
export function clearHistory(): void {
	if (!isBrowser) return;
	try {
		localStorage.removeItem(SEARCH_HISTORY_KEY);
	} catch {
		// silently ignore
	}
}
