import { Response } from "express";
import { InsightError, NotFoundError } from "../controller/IInsightFacade";

// ============== !!! TODO: ASK IF THIS IS OK !!! ==============

/* eslint-disable @ubccpsc310/descriptive/no-magic-numbers */
export enum HttpStatus {
	Ok = 200,
	BadRequest = 400,
	NotFound = 404,
}
/* eslint-enable @ubccpsc310/descriptive/no-magic-numbers */

export function handelError(res: Response, err: unknown): Response {
	if (err instanceof NotFoundError) {
		return res.status(HttpStatus.NotFound).json({ error: err.message });
	} else if (err instanceof InsightError) {
		return res.status(HttpStatus.BadRequest).json({ error: err.message });
	} else {
		return res.status(HttpStatus.BadRequest).json({ error: "Unknown error" });
	}
}
