import type { HttpClient } from "../../http";
import type {
	CreateTemplateInput,
	ListTemplatesParams,
	Template,
} from "../types";

export class TemplatesResource {
	constructor(private readonly http: HttpClient) {}

	/** GET /api/templates — scoped to the caller's org for non-admins. */
	list(params?: ListTemplatesParams): Promise<Template[]> {
		return this.http.get<Template[]>("/api/templates", {
			query: { ...params },
		});
	}

	/** POST /api/templates */
	create(input: CreateTemplateInput): Promise<Template> {
		return this.http.post<Template>("/api/templates", input);
	}
}
