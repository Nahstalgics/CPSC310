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

		const zipPath = path.join(__dirname, "..", "resources", "archives", "pair.zip");
		const zipData = await fs.readFile(zipPath);

		await request(URL)
			.put("/dataset/sections/sections")
			.set("Content-Type", "application/x-zip-compressed")
			.send(zipData)
			.expect(200);
	});

	after(async () => {
		await server.stop();
	});

	describe("Server PUT /dataset/:id/:kind (addDataset)", function () {
		// TODO: implement tetst !!!
	});

	describe("Server DEL /dataset/:id (removeDataset)", function () {
		// TODO: implement tetst !!!
	});

	describe("Server POST /query (performQuery)", function () {
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

	describe("Server GET /datasets", function () {
		// TODO: implement tetst !!!
	});
});
