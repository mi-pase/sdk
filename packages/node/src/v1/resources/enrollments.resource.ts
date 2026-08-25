import type { HttpClient } from "../../http";
import type {
	BulkEnrollInput,
	BulkEnrollResult,
	CopyEnrollmentsInput,
	CopyEnrollmentsResult,
	CreateEnrollmentInput,
	Enrollment,
	ListEnrollmentsParams,
} from "../types";

export class EnrollmentsResource {
	constructor(private readonly http: HttpClient) {}

	/** GET /api/enrollments */
	list(params?: ListEnrollmentsParams): Promise<Enrollment[]> {
		return this.http.get<Enrollment[]>("/api/enrollments", {
			query: { ...params },
		});
	}

	/** POST /api/enrollments — upserts the person by domain+email. */
	create(input: CreateEnrollmentInput): Promise<Enrollment> {
		return this.http.post<Enrollment>("/api/enrollments", input);
	}

	/**
	 * POST /api/enrollments/bulk
	 * Each row's `domain`/`project_id` default to the batch's top-level values.
	 */
	bulkCreate(input: BulkEnrollInput): Promise<BulkEnrollResult> {
		const rows = input.rows.map((row) => ({
			...row,
			domain: row.domain ?? input.domain,
			project_id: row.project_id ?? input.project_id,
		}));
		return this.http.post<BulkEnrollResult>("/api/enrollments/bulk", {
			domain: input.domain,
			project_id: input.project_id,
			rows,
		});
	}

	/** POST /api/enrollments/copy-to-project */
	copyToProject(
		input: CopyEnrollmentsInput,
	): Promise<CopyEnrollmentsResult> {
		return this.http.post<CopyEnrollmentsResult>(
			"/api/enrollments/copy-to-project",
			input,
		);
	}
}
