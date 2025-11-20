export class UI {
	private queryInput: HTMLTextAreaElement | null;
	private results: HTMLElement | null;

	constructor() {
		this.queryInput = document.getElementById("query-input") as HTMLTextAreaElement | null;
		this.results = document.getElementById("results");
	}

	// ===== QUERY =====
	public getQueryText(): string {
		return this.queryInput?.value ?? "";
	}

	public showResults(data: unknown): void {
		try {
			if (!this.results) {
				throw new Error("Results container not found");
			}

			this.results.innerHTML = "";

			const pre = document.createElement("pre");
			pre.textContent = JSON.stringify(data, null, 2);
			this.results.appendChild(pre);
		} catch (err: unknown) {
			const text = err instanceof Error ? err.message : String(err);
			this.showError(text);
		}

		// if (!this.results) {
		// 	this.showError("Results element not found.");
		// 	return;
		// }
		// this.results.textContent = JSON.stringify(data, null, 2);
	}

	public showError(message: string): void {
		if (!this.results) {
			return;
		}

		this.results.textContent = `Error: ${message}`;
	}
}
