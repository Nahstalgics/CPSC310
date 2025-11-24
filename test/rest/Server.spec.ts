import { expect } from "chai";
import fs from "fs-extra";
import path from "path";
import request from "supertest";

import Server from "../../src/rest/Server";

describe("Server", function () {
	let server: Server;
	const PORT = 4321;
	const URL = `http://localhost:${PORT}`;

	before(async function () {
		server = new Server();
		await server.start(PORT);
	});

	after(async () => {
		await server.stop();
	});

	async function loadArchive(filename: string): Promise<Buffer> {
		const zipPath = path.join(__dirname, "..", "resources", "archives", filename);
		return fs.readFile(zipPath);
	}

	async function addSectionsDataset(id: string, archiveFile: string): Promise<void> {
		const zipData = await loadArchive(archiveFile);

		const res = await request(URL)
			.put(`/dataset/${id}/sections`)
			.set("Content-Type", "application/x-zip-compressed")
			.send(zipData);

		// first add should be 200, if already exists from another test, it might be 400
		expect([200, 400]).to.include(res.status);
	}

	describe("Server PUT /dataset/:id/:kind (addDataset)", function () {
		before(async function () {
			await addSectionsDataset("sections", "pair.zip");
		});

		it("should return 200 and an array result for a valid query", async () => {
			const query = {
				WHERE: {
					GT: { sections_avg: 90 },
				},
				OPTIONS: {
					COLUMNS: ["sections_avg"],
					ORDER: "sections_avg",
				},
			};

			const res = await request(URL).post("/query").set("Content-Type", "application/json").send(query);

			expect(res.status).to.equal(200);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.be.an("array");
		});

		it("should return 400 and an error message for an invalid query", async () => {
			const badQuery = {
				OPTIONS: {
					COLUMNS: ["sections_dept"],
				},
			};

			const res = await request(URL).post("/query").set("Content-Type", "application/json").send(badQuery);

			expect(res.status).to.equal(400);
			expect(res.body).to.have.property("error");
			expect(res.body.error).to.be.a("string");
		});
	});

	describe("Server DEL /dataset/:id (removeDataset)", function () {
		before(async function () {
			await addSectionsDataset("sectionsToDelete", "pair.zip");
		});

		it("should remove an existing dataset and return 200", async () => {
			const res = await request(URL).delete("/dataset/sectionsToDelete");

			expect(res.status).to.equal(200);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.equal("sectionsToDelete");

			// verify it no longer appears in the list
			const listRes = await request(URL).get("/datasets");
			expect(listRes.status).to.equal(200);
			const ids = listRes.body.result.map((d: any) => d.id);
			expect(ids).to.not.include("sectionsToDelete");
		});

		it("should return 404 and an error for a non-existent dataset", async () => {
			const res = await request(URL).delete("/dataset/doesNotExist");

			expect(res.status).to.equal(404);

			expect(res.body).to.have.property("error");
			expect(res.body.error).to.be.a("string");
		});

		it("should return 400 and an error for an invalid dataset id (InsightError)", async () => {
			// id contains '_' which is invalid
			const res = await request(URL).delete("/dataset/_badId");

			expect(res.status).to.equal(400);
			expect(res.body).to.have.property("error");
			expect(res.body.error).to.be.a("string");
		});
	});

	describe("Server POST /query (performQuery)", function () {
		before(async function () {
			await addSectionsDataset("sections", "pair.zip");
		});

		it("should return 200 and an array result for a valid query", async () => {
			const query = {
				WHERE: {
					GT: { sections_avg: 90 },
				},
				OPTIONS: {
					COLUMNS: ["sections_avg"],
					ORDER: "sections_avg",
				},
			};

			const res = await request(URL).post("/query").set("Content-Type", "application/json").send(query);

			expect(res.status).to.equal(200);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.be.an("array");
		});

		it("should return 400 and an error message for an invalid query", async () => {
			const badQuery = {
				OPTIONS: {
					COLUMNS: ["sections_dept"],
				},
			};

			const res = await request(URL).post("/query").set("Content-Type", "application/json").send(badQuery);

			expect(res.status).to.equal(400);
			expect(res.body).to.have.property("error");
			expect(res.body.error).to.be.a("string");
		});
	});

	describe("Server GET /datasets (listDatasets)", function () {
		before(async function () {
			await addSectionsDataset("sectionsList", "pair.zip");
		});

		it("should return 200 and include the added dataset", async () => {
			const res = await request(URL).get("/datasets");

			expect(res.status).to.equal(200);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.be.an("array");

			expect(res.body.result.length).to.be.greaterThan(0);

			const ids = res.body.result.map((d: any) => d.id);
			expect(ids).to.include("sectionsList");
		});

		it("should return datasets with id, kind, and numRows properties", async () => {
			const res = await request(URL).get("/datasets");

			expect(res.status).to.equal(200);
			expect(res.body).to.have.property("result");
			expect(res.body.result).to.be.an("array");

			for (const ds of res.body.result) {
				expect(ds).to.have.property("id");
				expect(ds).to.have.property("kind");
				expect(ds).to.have.property("numRows");

				expect(ds.id).to.be.a("string");
				expect(ds.kind).to.be.a("string");
				expect(ds.numRows).to.be.a("number");
			}
		});
	});
});
