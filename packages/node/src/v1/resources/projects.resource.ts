import type { HttpClient } from "../../http";
import type { CreateProjectInput, ListProjectsParams, Project } from "../types";

export class ProjectsResource {
	constructor(private readonly http: HttpClient) {}

	/** GET /api/projects — scoped to the caller's org for non-admins. */
	list(params?: ListProjectsParams): Promise<Project[]> {
		return this.http.get<Project[]>("/api/projects", {
			query: { ...params },
		});
	}

	/** POST /api/projects */
	create(input: CreateProjectInput): Promise<Project> {
		return this.http.post<Project>("/api/projects", input);
	}
}
