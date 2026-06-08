import { describe, it, expect, beforeEach } from "vitest";
import {
	readHistory,
	getHistoryForCine,
	saveToHistory,
	clearHistory,
	SEARCH_HISTORY_KEY,
	MAX_HISTORY,
} from "../stores/searchHistory";

beforeEach(() => {
	localStorage.clear();
});

describe("readHistory()", () => {
	it("returns empty object when nothing is stored", () => {
		expect(readHistory()).toEqual({});
	});

	it("returns empty object when localStorage has invalid JSON", () => {
		localStorage.setItem(SEARCH_HISTORY_KEY, "not-json");
		expect(readHistory()).toEqual({});
	});

	it("returns parsed history when valid JSON is stored", () => {
		const data = { huajuapan: ["avengers", "batman"] };
		localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(data));
		expect(readHistory()).toEqual(data);
	});
});

describe("getHistoryForCine()", () => {
	it("returns empty array for cine with no history", () => {
		expect(getHistoryForCine("huajuapan")).toEqual([]);
	});

	it("returns history for the given cine", () => {
		saveToHistory("lagos", "spiderman");
		const history = getHistoryForCine("lagos");
		expect(history).toContain("spiderman");
	});
});

describe("saveToHistory()", () => {
	it("adds a query to the front of the list", () => {
		saveToHistory("huajuapan", "first");
		saveToHistory("huajuapan", "second");
		expect(getHistoryForCine("huajuapan")).toEqual(["second", "first"]);
	});

	it("deduplicates case-insensitively and moves to front", () => {
		saveToHistory("huajuapan", "avengers");
		saveToHistory("huajuapan", "Avengers");
		expect(getHistoryForCine("huajuapan")).toEqual(["Avengers"]);
	});

	it("ignores empty or whitespace-only queries", () => {
		saveToHistory("huajuapan", "");
		saveToHistory("huajuapan", "   ");
		expect(getHistoryForCine("huajuapan")).toEqual([]);
	});

	it("caps history at MAX_HISTORY entries per cine", () => {
		for (let i = 0; i < MAX_HISTORY + 5; i++) {
			saveToHistory("huajuapan", `query-${i}`);
		}
		expect(getHistoryForCine("huajuapan").length).toBe(MAX_HISTORY);
	});

	it("keeps separate histories per cine", () => {
		saveToHistory("huajuapan", "movie-a");
		saveToHistory("lagos", "movie-b");
		expect(getHistoryForCine("huajuapan")).toEqual(["movie-a"]);
		expect(getHistoryForCine("lagos")).toEqual(["movie-b"]);
	});
});

describe("clearHistory()", () => {
	it("removes all history from localStorage", () => {
		saveToHistory("huajuapan", "test");
		clearHistory();
		expect(readHistory()).toEqual({});
	});
});
