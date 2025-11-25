import express, { Application, Request, Response } from "express";
import cors from "cors";
import http from "http";
import { InsightDatasetKind } from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";
import { HttpStatus, handelError } from "./HandelError";
import { Log } from "@ubccpsc310/project-support";

export default class Server {
	private express: Application;
	private server?: http.Server;
	private readonly insightFacade: InsightFacade;

	constructor() {
		this.express = express();

		this.insightFacade = new InsightFacade();

		this.express.use(express.json());
		this.express.use(express.raw({ type: "application/*", limit: "10mb" }));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
		this.express.use(express.static("frontend/public"));

		this.registerRoutes();
	}

	// ===== Route Registration =====

	private registerRoutes(): void {
		this.express.put("/dataset/:id/:kind", this.handelAddDataset);
		this.express.delete("/dataset/:id", this.handelRemoveDataset);
		this.express.post("/query", this.handelPerformQuery);
		this.express.get("/datasets", this.handelListDatasets);
	}

	// ===== Handlers (call InsightFacade) =====

	private handelAddDataset = (req: Request, res: Response): void => {
		const id = req.params.id;
		const kind = InsightDatasetKind.Sections;

		// express raw gives as Buffer --> convert to base64 string
		const content = (req.body as Buffer).toString("base64");

		this.insightFacade
			.addDataset(id, content, kind)
			.then((result: unknown) => {
				res.status(HttpStatus.Ok).json({ result });
			})
			.catch((err: unknown) => handelError(res, err));
	};

	private handelRemoveDataset = (req: Request, res: Response): void => {
		const id = req.params.id;

		this.insightFacade
			.removeDataset(id)
			.then((result: unknown) => {
				res.status(HttpStatus.Ok).json({ result });
			})
			.catch((err: unknown) => handelError(res, err));
	};

	private handelPerformQuery = (req: Request, res: Response): void => {
		const query = req.body; // already parsed JSON

		this.insightFacade
			.performQuery(query)
			.then((result: unknown) => {
				res.status(HttpStatus.Ok).json({ result });
			})
			.catch((err: unknown) => handelError(res, err));
	};

	private handelListDatasets = (req: Request, res: Response): void => {
		this.insightFacade
			.listDatasets()
			.then((result: unknown) => {
				res.status(HttpStatus.Ok).json({ result });
			})
			.catch((err: unknown) => handelError(res, err));
	};

	// ===== Server Lifecycle =====

	public async start(port: number): Promise<void> {
		Log.info(`Server::start(${port}) - starting`);

		return new Promise((resolve, reject) => {
			this.server = this.express
				.listen(port, () => {
					Log.info(`Server::start(${port}) - listening`);
					resolve();
				})
				.on("error", (err: Error) => {
					Log.error(`Server::start(${port}) - ERROR: ${err.message}`);
					reject(err);
				});
		});
	}

	public async stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.server) {
				resolve();
				return;
			}
			this.server.close((err) => (err ? reject(err) : resolve()));
		});
	}
}
