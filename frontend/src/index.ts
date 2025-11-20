import { UI } from "./ui";
import { API } from "./api";

export class Controller {
	private readonly ui: UI;
	private readonly api: API;

	constructor(ui: UI, api: API) {
		this.ui = ui;
		this.api = api;
	}

	public init(): void {
		const runQueryButton = document.getElementById("run-query");

		runQueryButton?.addEventListener("click", async () => {
			await this.handleRunQuery();
		});
	}

	// ===== QUERY =====
	private async handleRunQuery(): Promise<void> {
		try {
			const text = this.ui.getQueryText();
			const query = JSON.parse(text);
			const result = await this.api.performQuery(query);
			this.ui.showResults(result);
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : String(err);
			this.ui.showError(message);
		}
	}
}

window.addEventListener("DOMContentLoaded", () => {
	const ui = new UI();
	const api = new API();
	const controller = new Controller(ui, api);
	controller.init();
});

