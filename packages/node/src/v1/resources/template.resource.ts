import type { HttpClient } from "../../http";
import type {
	SaveTemplateConfigInput,
	SaveTemplateConfigResult,
	Template,
	TemplateConfig,
	UpdateTemplateInput,
} from "../types";

export class TemplateResource {
	constructor(
		private readonly http: HttpClient,
		readonly id: string,
	) {}

	/** GET /api/templates/:id */
	get(): Promise<Template> {
		return this.http.get<Template>(`/api/templates/${this.id}`);
	}

	/** PUT /api/templates/:id */
	update(input: UpdateTemplateInput): Promise<Template> {
		return this.http.put<Template>(`/api/templates/${this.id}`, input);
	}

	/** DELETE /api/templates/:id */
	delete(): Promise<Template> {
		return this.http.delete<Template>(`/api/templates/${this.id}`);
	}

	/** POST /api/templates/:id/duplicate — also duplicates the synced Jano config, if any. */
	duplicate(): Promise<Template> {
		return this.http.post<Template>(`/api/templates/${this.id}/duplicate`);
	}

	/**
	 * GET /api/templates/:id/config — Apple + Google wallet design fetched live
	 * from the passes microservice. Resolves `undefined` if this template
	 * hasn't been synced yet (no `external_template_id`) — the API responds
	 * with an empty body rather than a JSON `null` in that case.
	 */
	getConfig(): Promise<TemplateConfig | undefined> {
		return this.http.get<TemplateConfig | undefined>(
			`/api/templates/${this.id}/config`,
		);
	}

	/**
	 * POST /api/templates/:id/config — creates or updates the synced Jano
	 * template. On first save, the returned external ID is persisted onto
	 * this template automatically by the API.
	 */
	saveConfig(
		input: SaveTemplateConfigInput,
	): Promise<SaveTemplateConfigResult> {
		return this.http.post<SaveTemplateConfigResult>(
			`/api/templates/${this.id}/config`,
			input,
		);
	}
}
