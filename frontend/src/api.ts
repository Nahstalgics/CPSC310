export type DatasetKind = "sections" | "rooms";

export interface DatasetInfo {
	id: string;
	kind: string;
	numRows: number;
}

export class API {
	private readonly baseUrl: string;

	constructor(baseUrl: string = "http://localhost:4321") {
		this.baseUrl = baseUrl;
	}

	public async addDataset(id: string, kind: DatasetKind, file: File): Promise<string[]> {
		// TODO: implement
		throw new Error();
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: implement
		throw new Error();
	}

	public async listDataset(): Promise<DatasetInfo[]> {
		// TODO: implement
		throw new Error();
	}

	public async performQuery(query: unknown): Promise<unknown[]> {
		const res = await fetch(`${this.baseUrl}/query`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(query),
		});

		return this.handleResponse<unknown[]>(res);
	}

	// ----- helper -----

	private async handleResponse<T>(res: Response): Promise<T> {
		const body = await res.json();

		if (!res.ok) {
			const msg =
				(body && (body.error as string | undefined)) ??
				`Request failed with status ${res.status}`;
			throw new Error(msg);
		}

		// server wraps successful responses as { result: ... }
		return (body.result as T) ?? (body as T);
	}
}
