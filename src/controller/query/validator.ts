import { InsightError } from "../IInsightFacade";
import type { GrammarConfig } from "./types";

// ===== Validation =====

export async function validateQuery(query: unknown, cfg: GrammarConfig): Promise<void> {
	assertObj(query, "$");

	const q = query as Record<string, unknown>;
	const keys = Object.keys(q);

	requireKeys(keys, ["WHERE", "OPTIONS"], "$"); // must have WHERE + OPTIONS
	forbidExtra(keys, ["WHERE", "OPTIONS"], "$"); // no extra top-level keys

	await validateWhere(q.WHERE, "$.WHERE", cfg); // WHERE per FILTER rules
	await validateOptions(q.OPTIONS, "$.OPTIONS", cfg); // OPTIONS per grammar
}

// ===== WHERE validator (FILTER) =====

// FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
// LOGICCOMPARISON ::= LOGIC ':[' FILTER_LIST ']'
// NEGATION ::= 'NOT :{' FILTER '}'
// MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
// SCOMPARISON ::= 'IS:{' skey ': "' [*]? inputstring [*]? '" }'
// 		Asterisks at the beginning or end of the inputstring should act as wildcards.
async function validateWhere(node: unknown, path: string, cfg: GrammarConfig): Promise<void> {
	if (isEmptyObject(node)) return; // empty WHERE:{} is valid

	assertObj(node, path); // WHERE must be an obj when not empty
	const obj = node as Record<string, unknown>;
	const keys = Object.keys(obj);
	const key = keys[0];

	if (keys.length !== 1) {
		// FILTER must have exactly 1 operator by design
		throw new InsightError(`${path}: WHERE must have exactly one key (AND/OR/NOT/LT/GT/EQ/IS)`);
	}

	// ------ NEGATION ------
	// NEGATION ::= 'NOT :{' FILTER '}'
	if (key === cfg.NEGATION) {
		// Value must be an object representing a single FILTER node.
		await validateWhere(obj[key], `${path}.NOT`, cfg);
		return;
	}

	// ------ LOGIC ------
	// LOGICCOMPARISON ::= LOGIC ':[' FILTER_LIST ']'
	// FILTER_LIST must contain at least one FILTER (non-empty array)
	if (cfg.LOGICS.has(key)) {
		// AND/OR
		const arr = obj[key];
		if (!Array.isArray(arr) || arr.length === 0) {
			throw new InsightError(`${path}.${key}: must be a non-empty array of FILTER`);
		}

		const validations = arr.map(async (child, i) => validateWhere(child, `${path}.${key}[${i}]`, cfg));
		await Promise.all(validations);

		return;
	}

	// ------- MCOMPARISON ------
	// MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
	// key is one of {LT, GT, EQ}. The value must be an object with exactly one numeric property.
	if (cfg.NUM_CMPS.has(key)) {
		validateMComparison(obj[key], `${path}.${key}`, cfg);
		return;
	}

	// ------ SCOMPARISON ------
	// SCOMPARISON ::= 'IS:{' skey ': "' [*]? inputstring [*]? '" }'
	// key === 'IS'. The value must be an object with exactly one string property.
	if (cfg.STR_CMPS.has(key)) {
		validateSComparison(obj[key], `${path}.IS`, cfg);
		return;
	}

	// Any other operator name is illegal per EBNF
	throw new InsightError(`${path}: unknown operator '${key}'`);
}

// ===== OPTIONS Validation =====
// OPTIONS ::= 'OPTIONS:{' COLUMNS '}' | 'OPTIONS:{' COLUMNS ', ORDER:' key '}'
async function validateOptions(node: unknown, path: string, _cfg: GrammarConfig): Promise<void> {
	assertObj(node, path);
	const obj = node as Record<string, unknown>;
	const keys = Object.keys(obj);

	if (!("COLUMNS" in obj)) {
		// COLUMNS is mandatory
		throw new InsightError(`${path}: missing 'COLUMNS'`);
	}

	const columns = obj.COLUMNS;
	if (!Array.isArray(columns) || columns.length === 0 || !columns.every(isString)) {
		throw new InsightError(`${path}.COLUMNS must be a non-empty array of strings`);
	}

	if ("ORDER" in obj) {
		if (!isString(obj.ORDER)) {
			throw new InsightError(`${path}.ORDER must be a string`);
		}
		if (!columns.includes(obj.ORDER)) {
			// must refrence one of the listed COLUMNS
			throw new InsightError(`${path}.ORDER must be one of COLUMNS`);
		}
	}

	forbidExtra(keys, ["COLUMNS", "ORDER"], path);
}

// ===== Leaf Validators =====
/** MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
 * - Inner value must be an object with exactly one property
 * - That property (mkey) must match "<idstring>_(avg|pass|fail|audit|year)"
 * - That value must be a finite number
 */
function validateMComparison(node: unknown, path: string, cfg: GrammarConfig): void {
	assertObj(node, path);
	const obj = node as Record<string, unknown>;
	const keys = Object.keys(obj);

	if (keys.length !== 1) {
		throw new InsightError(`${path}: must have exactly one mkey: number`);
	}

	const mkey = keys[0];
	const val = obj[mkey];

	// STRICT mkey shape: allow either:
	//	- QUOTED from (when treated as text), eg. "\"course_avg\"" matches MKEY_RE
	//	- UNQUOTED frim (how JS stores object propert names), eg. "course_avg" matches MKEY_UNQUOTED_RE
	const quoted = JSON.stringify(mkey);
	const mkeyValid = cfg.MKEY_RE.test(quoted) || cfg.MKEY_UNQUOTED_RE.test(mkey);
	if (!mkeyValid) {
		throw new InsightError(`${path}: invalid mkey '${mkey}' 
            (expected "<idstring>_<avg|pass|fail|audit|year>")`);
	}

	// Value must be a number and not a NaN (Not a Number)
	if (typeof val !== "number" || Number.isNaN(val)) {
		throw new InsightError(`${path}.${mkey}: value must be a number`);
	}
}

/** SCOMPARISON ::= 'IS:{' skey ': "' [*]? inputstring [*]? '" }'
 * - Inner value must be an object with exactly one property
 * - That property (skey) must match "<idstring>_(dept|id|instructor|title|uuid)"
 * - That value must be a string
 * - '*' allowed only at the start and/or end (not inside)
 */
function validateSComparison(node: unknown, path: string, cfg: GrammarConfig): void {
	assertObj(node, path);
	const obj = node as Record<string, unknown>;
	const keys = Object.keys(obj);

	if (keys.length !== 1) {
		throw new InsightError(`${path}: must have exactly one skey: string`);
	}

	const skey = keys[0];
	const val = obj[skey];

	// STRICT skey shape: support quoted and unquoted checks
	const quoted = JSON.stringify(skey);
	const skeyValid = cfg.SKEY_RE.test(quoted) || cfg.SKEY_UNQUOTED_RE.test(skey);
	if (!skeyValid) {
		throw new InsightError(`${path}: invalid skey '${skey}' 
            (expected "<idstring>_<dept|id|instructor|title|uuid>")`);
	}

	if (!isString(val)) {
		throw new InsightError(`${path}.${skey}: value must be a string`);
	}

	if (!isValidISPattern(val)) {
		throw new InsightError(
			`${path}.${skey}: IS value must have '*' only at start/end 
            (examples: "foo", "*foo", "foo*", "*foo*")`
		);
	}
}

// ===== Validation Helpers =====
// inputstring (for IS): zero or more non-* chars; allow optional leading and/or trailing '*'
function isValidISPattern(s: unknown): s is string {
	if (typeof s !== "string") return false;
	// Allowed forms: "abc", "*abc", "abc*", "*abc*"
	// (no internal asterisks beyond the edges)
	const inner = s.replace(/^\*/, "").replace(/\*$/, "");
	const hasOnlyEdgeAsterisks = s === inner || s === `*${inner}` || s === `${inner}*` || s === `*${inner}*`;
	const innerHasNoAsterisk = !inner.includes("*");
	return hasOnlyEdgeAsterisks && innerHasNoAsterisk;
}

function isString(x: unknown): x is string {
	return typeof x === "string";
}

function assertObj(x: unknown, path: string): asserts x is object {
	if (!x || typeof x !== "object" || Array.isArray(x)) {
		// reject null, primitives, arrays
		throw new InsightError(`${path}: expected object`);
	}
}

// Ensure all required keys are present in 'actual'
function requireKeys(actual: string[], required: string[], path: string): void {
	for (const k of required) {
		if (!actual.includes(k)) {
			throw new InsightError(`${path}: missing '${k}'`);
		}
	}
}

// Forbid any keys not listed in 'allowed'
function forbidExtra(actual: string[], allowed: string[], path: string): void {
	for (const k of actual) {
		if (!allowed.includes(k)) {
			throw new InsightError(`${path}: unexpected key '${k}'`);
		}
	}
}

function isEmptyObject(x: unknown): boolean {
	return (
		!!x && // gives boolean equivalent of x's truthness
		typeof x === "object" &&
		!Array.isArray(x) &&
		Object.keys(x).length === 0
	);
}
