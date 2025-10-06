import {
	IInsightFacade,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let smallsections: string;
	let none: string;
	let onevalid: string;
	let nocoursefolder: string;
	let missingavg: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		smallsections = await getContentFromArchives("smallpair.zip");
		none = await getContentFromArchives("nopair.zip");
		onevalid = await getContentFromArchives("onevalidcourse.zip");
		nocoursefolder = await getContentFromArchives("nocoursefolder.zip");
		missingavg = await getContentFromArchives("missingavgquery.zip");
		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should reject with an empty dataset id", async function () {
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should not add with a whitespace dataset id", async function () {
			try {
				await facade.addDataset("  ", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should not add with an underscore dataset id", async function () {
			try {
				await facade.addDataset("a_sds", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should add a valid dataset with a valid id, content, and kind", async function () {
			const result = await facade.addDataset("abc", sections, InsightDatasetKind.Sections);
			expect(result).to.deep.equal(["abc"]);
		});

		it("should add a valid dataset with a valid everything, new/smaller content", async function () {
			const result = await facade.addDataset("abc", onevalid, InsightDatasetKind.Sections);
			expect(result).to.deep.equal(["abc"]);
		});

		it("should add two valid dataset with a valid id, content, and kind", async function () {
			await facade.addDataset("abc", sections, InsightDatasetKind.Sections);
			const result = await facade.addDataset("def", sections, InsightDatasetKind.Sections);
			expect(result).to.deep.equal(["abc", "def"]);
		});

		it("should reject bc invalid (no files in courses)", async function () {
			try {
				await facade.addDataset("hello", none, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject bc invalid content(no valid sections in the file in course)", async function () {
			try {
				await facade.addDataset("hello", smallsections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject bc Kind = Rooms is not valid yet", async function () {
			try {
				await facade.addDataset("hello", sections, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject bc valid file but not inside course folder (diff named)", async function () {
			try {
				await facade.addDataset("hello", nocoursefolder, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject bc content is literally jsut a random string", async function () {
			try {
				await facade.addDataset("hello", "hello", InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject bc missing query(avg) field", async function () {
			try {
				await facade.addDataset("sections", missingavg, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		});

		it("should reject with id of an already added dataset", async function () {
			try {
				await facade.addDataset("330", sections, InsightDatasetKind.Sections);
				await facade.addDataset("330", sections, InsightDatasetKind.Sections);
				return expect.fail("Should have thrown!");
			} catch (err) {
				return expect(err).to.be.an.instanceOf(InsightError);
			}
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should reject when removing an id that does not match any available dataset", async function () {
			try {
				await facade.removeDataset("whaaaaaaaaaaat");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should not remove with an empty dataset id", async function () {
			try {
				await facade.removeDataset("");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a whitespace dataset id", async function () {
			try {
				await facade.removeDataset("   ");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a underscore dataset id", async function () {
			try {
				await facade.removeDataset("a_a");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should accept removal", async function () {
			await facade.addDataset("abc", sections, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("abc");
			expect(result).to.deep.equal("abc");
		});

		it("should accept 2 removal", async function () {
			await facade.addDataset("abc", sections, InsightDatasetKind.Sections);
			await facade.addDataset("def", onevalid, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("abc");
			expect(result).to.deep.equal("abc");
			const result1 = await facade.removeDataset("def");
			expect(result1).to.deep.equal("def");
		});

		it("should accept 1 removal, leave 1", async function () {
			await facade.addDataset("abc", sections, InsightDatasetKind.Sections);
			await facade.addDataset("def", onevalid, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("abc");
			expect(result).to.deep.equal("abc");
		});

		it("should reject 1 removal and 1", async function () {
			await facade.addDataset("abc", sections, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("abc");
			expect(result).to.deep.equal("abc");
			try {
				await facade.removeDataset("abc");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should not remove b/c case sensitive", async function () {
			await facade.addDataset("abc", onevalid, InsightDatasetKind.Sections);
			try {
				await facade.removeDataset("Abc");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});
	});

	describe("ListDatasets", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should list nothing after adding nothing", async function () {
			const datasets = await facade.listDatasets();
			expect(datasets).to.have.length(0);
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);

			let result: InsightResult[] = []; // dummy value before being reassigned
			try {
				result = await facade.performQuery(input);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				// TODO: replace this failing assertion with your assertions. You will need to reason about the code in this function
				// to determine what to put here :)
				if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceOf(ResultTooLargeError);
				} else {
					expect(err).to.be.instanceOf(InsightError);
				}
				return;
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			// TODO: replace this failing assertion with your assertions. You will need to reason about the code in this function
			// to determine what to put here :)
			expect(result).to.have.members(expected);
			return;
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.

		// it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery); // execution !!!
		it("[invalid/nooption.json] Query missing COLUMNS", checkQuery);
		it("[invalid/resultoobig.json] Return more than 5000", checkQuery);
		it("[invalid/multipleref.json] References more than one dataset", checkQuery);
		it("[invalid/nodatasetref.json] Can not find referenced dataset", checkQuery);
		it("[invalid/invalidwildcard.json] Can not find referenced dataset", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		it("[invalid/ANDnonemptyarray.json] AND has nothing in it", checkQuery);
		it("[invalid/invalidkey.json] Invalid Key", checkQuery);
		it("[invalid/toomanyasterisks.json] Too many asterisks ", checkQuery);
		it("[invalid/missingoptions.json] Query missing OPTIONS ", checkQuery);
		it("[invalid/nothinginwhere.json] nothing in WHERE", checkQuery); // execution !!!
		it("[invalid/nothinginoptions.json] nothing in columns", checkQuery);
		it("[invalid/wrongcomparetypeis.json]is compares number", checkQuery);
		it("[invalid/actualrefmult.json]references multiple datasets", checkQuery); // execution !!!
		it("[invalid/incorrectreference.json]references nonexistent datasets", checkQuery); // execution !!!
		it("[invalid/twowildcardsatfront.json]two wildcards at front", checkQuery);
		it("[invalid/onlywildcard.json] nothing except wildcard", checkQuery); // execution !!!
		// it("[valid/yearequal1900.json] year = 1900", checkQuery); // execution !!!
		it("[invalid/year1900toobig.json] year = 1900, result too large", checkQuery); // execution !!!
		// it("[valid/sectionsidcheck.json] normal check using sections_id", checkQuery); // execution !!!
		it("[invalid/numforstr.json] number for sfield", checkQuery);
		it("[invalid/strfornum.json] string for mfield", checkQuery);
		// it("[valid/noorder.json] No ORDER query", checkQuery); // execution !!!
		// it("[valid/whitespaceasterisk.json] whitespace followed by asterisk, valid, but empty", checkQuery); // execution !!!
		it("[invalid/randominor.json] OR compares GT and a string??", checkQuery);
		it("[invalid/nothastwoargs.json] NOT compares two instead of only 1 FILTER", checkQuery);
		it("[invalid/invalidop.json] invalid key", checkQuery);
		it("[invalid/nothingincolumns.json] empty array in columns", checkQuery);
		// it("[valid/complex.json]Complex Query", checkQuery); // execution !!!
		// it("[valid/nestednots.json]Nested NOts", checkQuery); execution // !!!
	});

	describe("PerformQuery - validation only (no add/list/remove)", () => {
		async function expectValid(query: unknown) {
			try {
				const res = await facade.performQuery(query);
				expect(res).to.be.an("array");
			} catch (err) {
				expect.fail(`performQuery threw unexpected error: ${err}`);
			}
		}

		async function expectInvalid(query: unknown) {
			try {
				await facade.performQuery(query);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.an.instanceOf(InsightError);
			}
		}

		// Valid Cases
		it("valid: minimal WHERE:{} with one column", async () => {
			const query = {
				WHERE: {},
				OPTIONS: { COLUMNS: ["sections_dept"] },
			};
			await expectValid(query);
		});

		it("valid: numeric comparison (GT) + ORDER inside columns", async () => {
			const query = {
				WHERE: {
					GT: { sections_avg: 90 },
				},
				OPTIONS: {
					COLUMNS: ["sections_avg"],
					ORDER: "sections_avg",
				},
			};
			await expectValid(query);
		});

		it("valid: AND over two filters", async () => {
			const query = {
				WHERE: {
					AND: [{ IS: { sections_dept: "cpsc" } }, { LT: { sections_year: 2015 } }],
				},
				OPTIONS: { COLUMNS: ["sections_dept", "sections_year"] },
			};
			await expectValid(query);
		});

		it("valid: NOT around an inner FILTER", async () => {
			const query = {
				WHERE: {
					NOT: { IS: { sections_instructor: "smith" } },
				},
				OPTIONS: { COLUMNS: ["sections_instructor"] },
			};
			await expectValid(query);
		});

		it("valid: IS string with edge wildcards only ('*foo*')", async () => {
			const query = {
				WHERE: {
					IS: { sections_title: "*algebra*" },
				},
				OPTIONS: { COLUMNS: ["sections_title"] },
			};
			await expectValid(query);
		});

		it("valid: query provided as JSON string", async () => {
			const asObj = {
				WHERE: { EQ: { sections_year: 2010 } },
				OPTIONS: { COLUMNS: ["sections_year"], ORDER: "sections_year" },
			};
			const json = JSON.stringify(asObj);
			await expectValid(json);
		});

		// Invalid Cases
		it("invalid: missing WHERE", async () => {
			const query = {
				OPTIONS: { COLUMNS: ["sections_dept"] },
			};
			await expectInvalid(query);
		});

		it("invalid: missing OPTIONS", async () => {
			const query = { WHERE: {} };
			await expectInvalid(query);
		});

		it("invalid: extra root key", async () => {
			const query = {
				WHERE: {},
				OPTIONS: { COLUMNS: ["sections_dept"] },
				EXTRA: true,
			};
			await expectInvalid(query);
		});

		it("invalid: WHERE with more than one operator key", async () => {
			const query = {
				WHERE: {
					GT: { sections_avg: 90 },
					LT: { sections_avg: 95 },
				},
				OPTIONS: { COLUMNS: ["sections_avg"] },
			};
			await expectInvalid(query);
		});

		it("invalid: AND with empty array", async () => {
			const query = {
				WHERE: { AND: [] },
				OPTIONS: { COLUMNS: ["sections_dept"] },
			};
			await expectInvalid(query);
		});

		it("invalid: NOT with non-object value", async () => {
			const query = {
				WHERE: { NOT: [] },
				OPTIONS: { COLUMNS: ["sections_dept"] },
			};
			await expectInvalid(query);
		});

		// Invalid Cases (MCOMPARISON)
		it("invalid: GT inner object has 2 keys", async () => {
			const query = {
				WHERE: {
					GT: { sections_avg: 90, sections_pass: 50 },
				},
				OPTIONS: { COLUMNS: ["sections_avg"] },
			};
			await expectInvalid(query);
		});

		it("invalid: GT value is not a number", async () => {
			const query = {
				WHERE: {
					GT: { sections_avg: "90" },
				},
				OPTIONS: { COLUMNS: ["sections_avg"] },
			};
			await expectInvalid(query);
		});

		it("invalid: mkey field name not allowed (bad mfield)", async () => {
			const query = {
				WHERE: {
					GT: { sections_unknown: 10 },
				},
				OPTIONS: { COLUMNS: ["sections_unknown"] },
			};
			await expectInvalid(query);
		});

		it("invalid: mkey idstring contains underscore (not allowed by EBNF)", async () => {
			const query = {
				WHERE: {
					GT: { sec_tions_avg: 10 },
				},
				OPTIONS: { COLUMNS: ["sec_tions_avg"] },
			};
			await expectInvalid(query);
		});

		// Invalid Cases (SCOMPARISON)
		it("invalid: IS inner object has 2 keys", async () => {
			const query = {
				WHERE: {
					IS: { sections_dept: "cpsc", sections_title: "algo" },
				},
				OPTIONS: { COLUMNS: ["sections_dept"] },
			};
			await expectInvalid(query);
		});

		it("invalid: IS value not a string", async () => {
			const query = {
				WHERE: {
					IS: { sections_dept: 123 },
				},
				OPTIONS: { COLUMNS: ["sections_dept"] },
			};
			await expectInvalid(query);
		});

		it("invalid: IS with internal wildcard (not only at edges)", async () => {
			const query = {
				WHERE: {
					IS: { sections_title: "al*ge*bra" },
				},
				OPTIONS: { COLUMNS: ["sections_title"] },
			};
			await expectInvalid(query);
		});

		it("invalid: skey field name not allowed (bad sfield)", async () => {
			const query = {
				WHERE: {
					IS: { sections_department: "cpsc" },
				},
				OPTIONS: { COLUMNS: ["sections_department"] },
			};
			await expectInvalid(query);
		});

		it("invalid: skey idstring contains underscore (disallowed by EBNF)", async () => {
			const query = {
				WHERE: {
					IS: { sec_tions_dept: "cpsc" },
				},
				OPTIONS: { COLUMNS: ["sec_tions_dept"] },
			};
			await expectInvalid(query);
		});

		// Invalid Cases (OPTIONS)
		it("invalid: OPTIONS missing COLUMNS", async () => {
			const query = {
				WHERE: {},
				OPTIONS: { ORDER: "sections_avg" },
			};
			await expectInvalid(query);
		});

		it("invalid: COLUMNS empty", async () => {
			const query = {
				WHERE: {},
				OPTIONS: { COLUMNS: [] },
			};
			await expectInvalid(query);
		});

		it("invalid: COLUMNS contains a non-string", async () => {
			const query = {
				WHERE: {},
				OPTIONS: { COLUMNS: ["sections_dept", 42 as any] },
			};
			await expectInvalid(query);
		});

		it("invalid: ORDER not a string", async () => {
			const query = {
				WHERE: {},
				OPTIONS: { COLUMNS: ["sections_avg"], ORDER: 5 as any },
			};
			await expectInvalid(query);
		});

		it("invalid: ORDER not in COLUMNS", async () => {
			const query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: ["sections_dept"],
					ORDER: "sections_avg",
				},
			};
			await expectInvalid(query);
		});

		it("invalid: OPTIONS contains extra key", async () => {
			const query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: ["sections_dept"],
					EXTRA: true,
				},
			};
			await expectInvalid(query);
		});
	});
});
