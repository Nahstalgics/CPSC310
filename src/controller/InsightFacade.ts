import { IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult, InsightError } from "./IInsightFacade";
import JSZip from "jszip";

interface Section {
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

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

	private idValid(id: string): boolean {
		return !(id.includes("_") || id.trim().length === 0);
	}

	private async parseSections(content: string) /* idk what it'll return yet */ {
		let sections: Section[] = [];
		const zip = new JSZip();
		const file =  await zip.loadAsync(content);
		const courses = zip.folder("courses");
		if (!courses) {
			throw new InsightError("Does not contain courses folder");
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (kind === InsightDatasetKind.Sections) {

		} else {
			throw new InsightError("Invalid InsightDatasetKind");
		}

		//remove later
		throw new Error(
			`InsightFacadeImpl::addDataset() is unimplemented! - id=${id}; content=${content?.length}; kind=${kind}`
		);
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::removeDataset() is unimplemented! - id=${id};`);
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
