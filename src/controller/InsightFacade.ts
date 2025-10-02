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
const MKEY_RE = new RegExp(`^"${IDSTRING}_${MFIELD}"$`);

// skey = "<idstring>_<sfield>"
const SFIELD = "(dept|id|instructor|title|uuid)";
const SKEY_RE = new RegExp(`^"${IDSTRING}_${SFIELD}"$`);

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

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// addDataset = process zip files into array of Sections

		// TODO: Remove this once you implement the methods!

		// 1. parse and validate the input query
		let parsed: unknown;

		// check if incoming query is a string (eg. raw JSON string)
		if (typeof query === "string") {
			try { 
				parsed = JSON.parse(query);
			} catch (err) {
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

		// 2. perform semantic checks on the query and evaluate the query only if it is valid
		//		Since the type for the query is unknown, technically anything could be passed.
		// 		A valid query will be an object type matching the requirements below
		//		first check should be rejecting query if it is not an object type

		// 2.1. valid query --> Is based on the given EBNF grammar
		// 		WHERE defines which sections should be included in the results.
		// 		COLUMNS defines which keys should be included in each result.
		//		ORDER defines what order the results should be in.
		// 		see https://pages.github.students.cs.ubc.ca/CPSC310-2025W-T1/#/project/sections?id=query-ebnf for EBNF logic

		// 2.2. valid query --> References exactly one dataset in its query keys
		// 2.3. valid query --> Has less than or equal to 5000 results. If this limit is exceeded,
		// 			the query should reject with a ResultTooLargeError.

		// 2.4. wildcards
		// 		inputstring:  Matches inputstring exactly
		//		*inputstring:  Ends with inputstring
		// 		inputstring*: Starts with inputstring
		//		*inputstring*: Contains inputstring
		//		ERROR: There are no "in the middle" asterisks, such as input*string, allowed

		// 2.5 order
		//		The ORDER key must be a key found in the COLUMN KEY_LIST array.
		//		If ORDER is not specified, any ordering of the results is valid.

		// 2.6 valid query keys
		//		the query keys are the mkey and skey
		//		a valid query key has two parts, separated by an underscore: <idstring>_<mfield | sfield>.
		// 		idstring is the dataset id provided by the user when they add the dataset (the id parameter).
		//		mfield | sfield is the column key that represents a piece of information about the course.

		// 3 execute the query

		//throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
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

	private async validateWhere(node: unknown, path: string): Promise<void> {
		// TODO !!!
	}

	private async validateOptions(node: unknown, path: string): Promise<void> {
		// TODO !!!
	}

	// ===== Helpers =====
	private assertObj(x: unknown, path: string): asserts x is object {
		if (!x || typeof x !== "object" || Array.isArray(x)) {   // reject null, primitives, arrays
    		throw new InsightError(`${path}: expected object`);
  		}
	}

	// Ensure all required keys are present in 'actual' 
	private requireKeys(actual: string[], required: string[], path: string) {
		// TODO !!! 
		for (const k of required) {
			if (!actual.includes(k)) {
				throw new InsightError(`${path}: missing '${k}'`);
			}
		}
	}

	// Forbid any keys not listed in 'allowed' 
	private forbidExtra(actual: string[], allowed: string[], path: string) {
		// TODO !!!
		for (const k of actual) {
    		if (!allowed.includes(k)) { 
      			throw new InsightError(`${path}: unexpected key '${k}'`);
    		}
  		}
	}

	// EBNF stuff
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
