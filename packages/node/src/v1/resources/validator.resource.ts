import type { HttpClient } from "../../http";
import type {
	ListValidationRecordsParams,
	ScanPassInput,
	ScanResult,
	UpdateValidatorInput,
	Validator,
	ValidationRecordsPage,
} from "../types";

export class ValidatorResource {
	constructor(
		private readonly http: HttpClient,
		readonly id: string,
	) {}

	/** GET /api/validators/:id */
	get(): Promise<Validator> {
		return this.http.get<Validator>(`/api/validators/${this.id}`);
	}

	/** PUT /api/validators/:id */
	update(input: UpdateValidatorInput): Promise<Validator> {
		return this.http.put<Validator>(`/api/validators/${this.id}`, input);
	}

	/** DELETE /api/validators/:id — soft-delete. */
	delete(): Promise<{ deleted: true }> {
		return this.http.delete<{ deleted: true }>(
			`/api/validators/${this.id}`,
		);
	}

	/**
	 * POST /api/validators/:id/scan — validates a scanned pass and records
	 * the result. Returns `{ matches: [...] }` instead if the scanned value
	 * resolves to multiple enrollments and no `enrollmentId` was given — see
	 * `isScanAmbiguous`.
	 */
	scan(input: ScanPassInput): Promise<ScanResult> {
		return this.http.post<ScanResult>(
			`/api/validators/${this.id}/scan`,
			input,
			{ idempotent: false },
		);
	}

	/** GET /api/validators/:id/records */
	records(
		params?: ListValidationRecordsParams,
	): Promise<ValidationRecordsPage> {
		return this.http.get<ValidationRecordsPage>(
			`/api/validators/${this.id}/records`,
			{ query: { ...params } },
		);
	}
}
