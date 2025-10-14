import InsightFacade from "../../src/controller/InsightFacade";

export class TestFacade extends InsightFacade {
	// Override to avoid disk access
	protected async loadAllDatasets(): Promise<any[]> {
		return [
			{
				id: "sections",
				kind: 0,
				numRows: 2,
				sections: [
					{
						dept: "cpsc",
						id: "310",
						avg: 85,
						instructor: "Reid",
						title: "Software",
						pass: 100,
						fail: 2,
						audit: 0,
						uuid: "1",
						year: 2019,
					},
					{
						dept: "math",
						id: "200",
						avg: 72,
						instructor: "Smith",
						title: "Algebra",
						pass: 120,
						fail: 5,
						audit: 1,
						uuid: "2",
						year: 2012,
					},
				],
			},
		];
	}
}
