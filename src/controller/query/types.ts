import { InsightDataset } from "../IInsightFacade";

// performQuery interfaces
export interface GrammarConfig {
	LOGICS: Set<string>;
	NEGATION: string;
	NUM_CMPS: Set<string>;
	STR_CMPS: Set<string>;
	MKEY_RE: RegExp;
	SKEY_RE: RegExp;
	MKEY_UNQUOTED_RE: RegExp;
	SKEY_UNQUOTED_RE: RegExp;
}

// addDataset interfaces
export interface Section {
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

export type InsightDatasetExtend = InsightDataset & { sections: Section[] };
