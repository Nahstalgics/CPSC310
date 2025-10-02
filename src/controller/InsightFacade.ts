import { IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult, InsightError } from "./IInsightFacade";
import JSZip from "jszip";

interface Section {
	uuid: string;
	id: string;
	title: string;
	instructor: string;
	dept: string;
	year: number;
	avg: number;
	pass: number;
	fail: number;
	audit: number;
}

// Operators by catagory (EBNF)
const LOGICS = new Set(["AND", "OR"]);
const NEGATION = "NOT";
const NUM_CMPS = new Set(["LT", "GT", "EQ"]); // MCOMPARATOR
const STR_CMPS = new Set(["IS"]); // SCOMPARATOR

// idstring: one or more chars except underscore
const IDSTRING = "[^_]+";

// mkey = "<idstring>_<mfield>"
const MFIELD = "(avg|pass|fail|audit|year)";
const MKEY_RE = new RegExp(`^"${IDSTRING}_${MFIELD}"$`); // matches a QUOTED property name (as text)

// skey = "<idstring>_<sfield>"
const SFIELD = "(dept|id|instructor|title|uuid)";
const SKEY_RE = new RegExp(`^"${IDSTRING}_${SFIELD}"$`); // matches a QUOTED property name (as text)

// Unquoted variants (objects parsed by JS have unquoted property names)
const MKEY_UNQUOTED_RE = new RegExp(`^${IDSTRING}_${MFIELD}$`);
const SKEY_UNQUOTED_RE = new RegExp(`^${IDSTRING}_${SFIELD}$`);

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private idValid(id: string): boolean {
		return !(id.includes("_") || id.trim().length === 0);
	}

	private async parseSections(content: string) /* idk what it'll return yet */ {
		const sections: Section[] = [];
		const zip = new JSZip();
		const file = await zip.loadAsync(content);
		const courses = zip.folder("courses");
		if (!courses) {
			throw new InsightError("Does not contain courses folder");
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (kind === InsightDatasetKind.Sections) {
		} else {
			throw new InsightError("Invalid InsightDatasetKind");
		}

		//remove later
		throw new Error(
			`InsightFacadeImpl::addDataset() is unimplemented! - id=${id}; content=${content?.length}; kind=${kind}`
		);
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::removeDataset() is unimplemented! - id=${id};`);
	}

	/* 1. parse and validate the input query

	2. perform semantic checks on the query and evaluate the query only if it is valid
			Since the type for the query is unknown, technically anything could be passed.
			A valid query will be an object type matching the requirements below
			first check should be rejecting query if it is not an object type

	2.1. valid query --> Is based on the given EBNF grammar
			WHERE defines which sections should be included in the results.
			COLUMNS defines which keys should be included in each result.
			ORDER defines what order the results should be in.
			see https://pages.github.students.cs.ubc.ca/CPSC310-2025W-T1/#/project/sections?id=query-ebnf for EBNF logic

	2.2. valid query --> References exactly one dataset in its query keys
	2.3. valid query --> Has less than or equal to 5000 results. If this limit is exceeded,
				the query should reject with a ResultTooLargeError.

	2.4. wildcards
			inputstring:  Matches inputstring exactly
			*inputstring:  Ends with inputstring
			inputstring*: Starts with inputstring
			*inputstring*: Contains inputstring
			ERROR: There are no "in the middle" asterisks, such as input*string, allowed

	2.5 order
			The ORDER key must be a key found in the COLUMN KEY_LIST array.
			If ORDER is not specified, any ordering of the results is valid.

	2.6 valid query keys
			the query keys are the mkey and skey
			a valid query key has two parts, separated by an underscore: <idstring>_<mfield | sfield>.
			idstring is the dataset id provided by the user when they add the dataset (the id parameter).
			mfield | sfield is the column key that represents a piece of information about the course.

	3 execute the query */
	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// addDataset = process zip files into array of Sections

		// TODO: Remove this once you implement the methods!

		let parsed: unknown;

		// check if incoming query is a string (eg. raw JSON string)
		if (typeof query === "string") {
			try {
				parsed = JSON.parse(query);
			} catch {
				throw new InsightError("performQuery: invalid JSON string provided"); // !!!
			}
		} else {
			parsed = query; // query alr obj
		}

		await this.validateQuery(parsed);

		const wellFormedQuery = parsed as {
			WHERE: unknown;
			OPTIONS: { COLUMNS: string[]; ORDER?: string };
		};

		// TODO !!! -- implement evaluation query
		//	1) Evaluate q.WHERE against your dataset (AND/OR/NOT/LT/GT/EQ/IS)
		//	2) Project columns in q.OPTIONS.COLUMNS
		//	3) Sort by q.OPTIONS.ORDER if provided

		return [{ result: "example " }] as InsightResult[]; // so doesn't throw error
	}

	private async validateQuery(query: unknown): Promise<void> {
		this.assertObj(query, "$");

		const q = query as Record<string, unknown>;
		const keys = Object.keys(q);

		this.requireKeys(keys, ["WHERE", "OPTIONS"], "$"); // must have WHERE + OPTIONS
		this.forbidExtra(keys, ["WHERE", "OPTIONS"], "$"); // no extra top-level keys

		await this.validateWhere(q.WHERE, "$.WHERE"); // WHERE per FILTER rules
		await this.validateOptions(q.OPTIONS, "$.OPTIONS"); // OPTIONS per grammar
	}

	// ===== WHERE validator (FILTER) =====

	// FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
	// LOGICCOMPARISON ::= LOGIC ':[' FILTER_LIST ']'
	// NEGATION ::= 'NOT :{' FILTER '}'
	// MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
	// SCOMPARISON ::= 'IS:{' skey ': "' [*]? inputstring [*]? '" }'  // Asterisks at the beginning or end of the inputstring should act as wildcards.
	private async validateWhere(node: unknown, path: string): Promise<void> {
		if (this.isEmptyObject(node)) return; // empty WHERE:{} is valid

		this.assertObj(node, path); // WHERE must be an obj when not empty
		const obj = node as Record<string, unknown>;
		const keys = Object.keys(obj);

		if (keys.length !== 1) {
			// FILTER must have exactly 1 operator by design
			throw new InsightError(`${path}: WHERE must have exactly one key (AND/OR/NOT/LT/GT/EQ/IS)`);
		}

		const key = keys[0];

		// ------ NEGATION ------
		// NEGATION ::= 'NOT :{' FILTER '}'
		if (key === NEGATION) {
			// Value must be an object representing a single FILTER node.
			await this.validateWhere(obj[key], `${path}.NOT`);
			return;
		}

		// ------ LOGIC ------
		// LOGICCOMPARISON ::= LOGIC ':[' FILTER_LIST ']'
		// FILTER_LIST must contain at least one FILTER (non-empty array)
		if (LOGICS.has(key)) {
			// AND/OR
			const arr = obj[key];
			if (!Array.isArray(arr) || arr.length === 0) {
				throw new InsightError(`${path}.${key}: must be a non-empty array of FILTER`);
			}

			for (let i = 0; i < arr.length; i++) {
				await this.validateWhere(arr[i], `${path}.${key}[${i}]`);
			}
			return;
		}

		// ------- MCOMPARISON ------
		// MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
		// key is one of {LT, GT, EQ}. The value must be an object with exactly one numeric property.
		if (NUM_CMPS.has(key)) {
			this.validateMComparison(obj[key], `${path}.${key}`);
			return;
		}

		// ------ SCOMPARISON ------
		// SCOMPARISON ::= 'IS:{' skey ': "' [*]? inputstring [*]? '" }'
		// key === 'IS'. The value must be an object with exactly one string property.
		if (STR_CMPS.has(key)) {
			this.validateSComparison(obj[key], `${path}.IS`);
			return;
		}

		// Any other operator name is illegal per EBNF
		throw new InsightError(`${path}: unknown operator '${key}'`);
	}

	// ===== OPTIONS Validation =====
	private async validateOptions(node: unknown, path: string): Promise<void> {
		// TODO !!!
	}

	// ===== Leaf Validators =====
	/** MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'
	 * - Inner value must be an object with exactly one property
	 * - That property (mkey) must match "<idstring>_(avg|pass|fail|audit|year)"
	 * - That value must be a finite number
	 */
	private validateMComparison(node: unknown, path: string): void {
		// TODO !!!
		// ...
	}

	private validateSComparison(node: unknown, path: string): void {
		// TODO !!!
	}

	// ===== Helpers =====
	private assertObj(x: unknown, path: string): asserts x is object {
		if (!x || typeof x !== "object" || Array.isArray(x)) {
			// reject null, primitives, arrays
			throw new InsightError(`${path}: expected object`);
		}
	}

	// Ensure all required keys are present in 'actual'
	private requireKeys(actual: string[], required: string[], path: string) {
		for (const k of required) {
			if (!actual.includes(k)) {
				throw new InsightError(`${path}: missing '${k}'`);
			}
		}
	}

	// Forbid any keys not listed in 'allowed'
	private forbidExtra(actual: string[], allowed: string[], path: string) {
		for (const k of actual) {
			if (!allowed.includes(k)) {
				throw new InsightError(`${path}: unexpected key '${k}'`);
			}
		}
	}

	private isEmptyObject(x: unknown): boolean {
		return (
			!!x && // gives boolean equivalent of x's truthness
			typeof x === "object" && // must be object
			!Array.isArray(x) && // not an array
			Object.keys(x).length === 0
		); // no keys
	}

	// inputstring (for IS): zero or more non-* chars; allow optional leading and/or trailing '*'
	private isValidISPattern(s: unknown): s is string {
		if (typeof s !== "string") return false;
		// Allowed forms: "abc", "*abc", "abc*", "*abc*"
		// (no internal asterisks beyond the edges)
		const inner = s.replace(/^\*/, "").replace(/\*$/, "");
		const hasOnlyEdgeAsterisks = s === inner || s === `*${inner}` || s === `${inner}*` || s === `*${inner}*`;
		const innerHasNoAsterisk = !inner.includes("*");
		return hasOnlyEdgeAsterisks && innerHasNoAsterisk;
	}

	// important func
	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
