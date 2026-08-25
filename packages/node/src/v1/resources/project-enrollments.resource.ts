import type { HttpClient } from "../../http";
import type {
	BulkEnrollResult,
	CreateEnrollmentInput,
	Enrollment,
} from "../types";

/** Enrollments scoped to a single project — `project_id` is filled in automatically. */
export class ProjectEnrollmentsResource {
	constructor(
		private readonly http: HttpClient,
		private readonly projectId: string,
	) {}

	/** GET /api/enrollments?project=:projectId */
	list(params?: { person?: string; domain?: string }): Promise<Enrollment[]> {
		return this.http.get<Enrollment[]>("/api/enrollments", {
			query: { ...params, project: this.projectId },
		});
	}

	/** POST /api/enrollments with `project_id` set to this project. */
	create(
		input: Omit<CreateEnrollmentInput, "project_id">,
	): Promise<Enrollment> {
		return this.http.post<Enrollment>("/api/enrollments", {
			...input,
			project_id: this.projectId,
		});
	}

	/** POST /api/enrollments/bulk with `project_id` set to this project. */
	bulkCreate(input: {
		domain: string;
		rows: Array<Omit<CreateEnrollmentInput, "domain" | "project_id">>;
	}): Promise<BulkEnrollResult> {
		const rows = input.rows.map((row) => ({
			...row,
			domain: input.domain,
			project_id: this.projectId,
		}));
		return this.http.post<BulkEnrollResult>("/api/enrollments/bulk", {
			domain: input.domain,
			project_id: this.projectId,
			rows,
		});
	}
}
