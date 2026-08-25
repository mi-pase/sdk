import type { HttpClient } from "../../http";
import type {
	CreateValidatorInput,
	ListValidatorsParams,
	Validator,
	ValidationRecord,
} from "../types";

export class ValidatorsResource {
	constructor(private readonly http: HttpClient) {}

	/** GET /api/validators?domain=... */
	list(params: ListValidatorsParams): Promise<Validator[]> {
		return this.http.get<Validator[]>("/api/validators", {
			query: { ...params },
		});
	}

	/** POST /api/validators */
	create(input: CreateValidatorInput): Promise<Validator> {
		return this.http.post<Validator>("/api/validators", input);
	}

	/** GET /api/validators/records?enrollments=id1,id2 */
	recordsForEnrollments(
		enrollmentIds: string[],
	): Promise<ValidationRecord[]> {
		return this.http.get<ValidationRecord[]>("/api/validators/records", {
			query: { enrollments: enrollmentIds.join(",") },
		});
	}
}
