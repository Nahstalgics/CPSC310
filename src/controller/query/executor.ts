import { InsightError } from "../IInsightFacade";
import type { InsightResult } from "../IInsightFacade";
import type { Section } from "./types";

// ===== Execution =====

export function isPlainEmptyObject(obj: unknown): boolean {
	return !!obj && typeof obj === "object" && !Array.isArray(obj) && Object.keys(obj as any).length === 0;
}

function splitKey(key: string): { id: string; field: string } {
	const idx = key.indexOf("_");
	if (idx < 0) throw new InsightError(`Bad key '${key}' (expected "<id>_<field>")`);
	return { id: key.slice(0, idx), field: key.slice(idx + 1) };
}

function collectIdsFromWhere(node: unknown, out: Set<string>): void {
	// WHERE: {}
	if (node && typeof node === "object" && !Array.isArray(node) && Object.keys(node as any).length === 0) return;
	if (!node || typeof node !== "object" || Array.isArray(node)) throw new InsightError("WHERE: expected object");

	const obj = node as Record<string, unknown>;
	const keys = Object.keys(obj);
	if (keys.length !== 1) throw new InsightError("WHERE must have exactly one key (AND/OR/NOT/LT/GT/EQ/IS)");

	const key = keys[0];

	if (key === "NOT") {
		collectIdsFromWhere(obj[key], out);
		return;
	}
	if (key === "AND" || key === "OR") {
		const arr = obj[key];
		if (!Array.isArray(arr) || arr.length === 0) {
			throw new InsightError(`${key}: must be a non-empty array of FILTER`);
		}
		for (const child of arr) collectIdsFromWhere(child, out);
		return;
	}
	if (key === "LT" || key === "GT" || key === "EQ" || key === "IS") {
		const inner = obj[key] as Record<string, unknown>;
		const innerKeys = Object.keys(inner);
		if (innerKeys.length !== 1) throw new InsightError(`${key}: must have exactly one key`);
		const leafKey = innerKeys[0]; // eg. "sections_avg" or "sections_dept"
		out.add(splitKey(leafKey).id);
		return;
	}
	throw new InsightError(`Unknown operator '${key}'`);
}

export function collectDatasetIds(query: {
	WHERE: unknown;
	OPTIONS: { COLUMNS: string[]; ORDER?: string };
}): Set<string> {
	const ids = new Set<string>();
	for (const col of query.OPTIONS.COLUMNS) ids.add(splitKey(col).id);
	if (query.OPTIONS.ORDER) ids.add(splitKey(query.OPTIONS.ORDER).id);
	collectIdsFromWhere(query.WHERE, ids);
	return ids;
}

// eval where recursively for one row
export function evalWhere(node: unknown, row: Section): boolean {
	if (isPlainEmptyObject(node)) return true;

	const obj = asRecord(node, "WHERE");
	const key = onlyKey(obj, "WHERE");

	if (key === "NOT") return evalNOT(obj[key], row);
	if (key === "AND" || key === "OR") return evalANDOR(key, obj, row);
	if (key === "LT" || key === "GT" || key === "EQ") return evalNumeric(key, obj[key], row);
	if (key === "IS") return evalIS(obj[key], row);

	throw new InsightError(`Unknown operator '${key}'`);
}

function asRecord(node: unknown, ctx: string): Record<string, unknown> {
	if (!node || typeof node !== "object" || Array.isArray(node)) throw new InsightError(`${ctx}: expected object`);
	return node as Record<string, unknown>;
}

function onlyKey(obj: Record<string, unknown>, ctx: string): string {
	const keys = Object.keys(obj);
	if (keys.length !== 1) throw new InsightError(`${ctx} must have exactly one key`);
	return keys[0];
}

function numericFromRow(row: Section, key: string): number | undefined {
	const val = getValue(row, key);
	const num = typeof val === "number" ? val : Number(val);
	return Number.isFinite(num) ? num : undefined;
}

function evalNOT(node: unknown, row: Section): boolean {
	return !evalWhere(node, row);
}

function evalANDOR(key: "AND" | "OR", node: unknown, row: Section): boolean {
	const arr = asRecord(node, key)[key];
	if (!Array.isArray(arr) || arr.length === 0) {
		throw new InsightError(`${key}: must be a non-empty array of FILTER`);
	}
	const results = (arr as unknown[]).map((c) => evalWhere(c, row));
	return key === "AND" ? results.every(Boolean) : results.some(Boolean);
}

function evalNumeric(key: "LT" | "GT" | "EQ", node: unknown, row: Section): boolean {
	const inner = asRecord(node, key);
	const mkey = onlyKey(inner, `${key}`);
	const cmpVal = inner[mkey];
	if (typeof cmpVal !== "number" || Number.isNaN(cmpVal))
		throw new InsightError(`${key}.${mkey}: value must be a number`);

	const val = numericFromRow(row, mkey);
	if (val === undefined) return false;

	if (key === "LT") return val < cmpVal;
	if (key === "GT") return val > cmpVal;
	return val === cmpVal;
}

function evalIS(node: unknown, row: Section): boolean {
	const inner = asRecord(node, "IS");
	const skey = onlyKey(inner, "IS");
	const pat = inner[skey];
	if (typeof pat !== "string") throw new InsightError(`IS.${skey}: value must be a string`);
	const val = getValue(row, skey);
	return typeof val === "string" && matchesIS(val, pat);
}

// Map "<id>_<field>" to the row value
function getValue(row: Section, key: string): string | number | undefined {
	const { field } = splitKey(key);
	return (row as any)[field];
}

function matchesIS(value: string, pattern: string): boolean {
	if (pattern.startsWith("*") && pattern.endsWith("*")) {
		return value.includes(pattern.slice(1, -1));
	} else if (pattern.startsWith("*")) {
		return value.endsWith(pattern.slice(1));
	} else if (pattern.endsWith("*")) {
		return value.startsWith(pattern.slice(0, -1));
	}
	return value === pattern;
}

export function projectRows(rows: Section[], columns: string[]): InsightResult[] {
	return rows.map((r) => {
		const out: InsightResult = {};
		for (const col of columns) {
			(out as any)[col] = getValue(r, col);
		}
		return out;
	});
}

export function sortResults(results: InsightResult[], orderKey?: string): InsightResult[] {
	if (!orderKey) return results;
	const arr = [...results];
	arr.sort((a, b) => {
		const va = a[orderKey];
		const vb = b[orderKey];
		if (typeof va === "number" && typeof vb === "number") return va - vb;
		return String(va).localeCompare(String(vb));
	});
	return arr;
}
