import type { HttpClient } from "../../http";
import type { Enrollment, UpdateEnrollmentInput } from "../types";

export interface SetCustomFieldsOptions {
	/**
	 * The API replaces `customFields` wholesale on every update. By default
	 * (`override: false`) the SDK first fetches the enrollment and merges
	 * `fields` into the existing values so unrelated keys survive. Pass
	 * `override: true` to skip the fetch and replace `customFields` entirely
	 * with `fields`, matching the raw API behavior.
	 */
	override?: boolean;
}

export class EnrollmentResource {
	constructor(
		private readonly http: HttpClient,
		readonly id: string,
	) {}

	/** GET /api/enrollments/:id */
	get(): Promise<Enrollment> {
		return this.http.get<Enrollment>(`/api/enrollments/${this.id}`);
	}

	/** PUT /api/enrollments/:id — replaces `customFields` wholesale. */
	update(input: UpdateEnrollmentInput): Promise<Enrollment> {
		return this.http.put<Enrollment>(`/api/enrollments/${this.id}`, input);
	}

	/** DELETE /api/enrollments/:id — removes the person from the project and revokes issued passes. */
	delete(): Promise<Enrollment> {
		return this.http.delete<Enrollment>(`/api/enrollments/${this.id}`);
	}

	/**
	 * POST /api/enrollments/:id/revoke — revokes this enrollment's issued pass
	 * while keeping the person enrolled (unlike `delete`, which unenrolls them).
	 * Idempotent: a no-op if there is no issued pass. The pass can be re-issued
	 * later, and the returned enrollment reflects the revoked state (its
	 * `downloadUrl` is gone and `passState` is `revoked`).
	 */
	revoke(): Promise<Enrollment> {
		return this.http.post<Enrollment>(
			`/api/enrollments/${this.id}/revoke`,
		);
	}

	/**
	 * Set one or more custom field values.
	 *
	 * A value is a string for `text`/`date` fields, or a `string[]` for `list`
	 * fields.
	 *
	 * @example
	 * await client.project(projectId).enrollment(id).setCustomFields({ seat: "12A" });
	 * await client.enrollment(id).setCustomFields({ seat: "12A" }, { override: true });
	 * await client.enrollment(id).setCustomFields({ tags: ["vip", "press"] });
	 */
	async setCustomFields(
		fields: Record<string, string | string[]>,
		options: SetCustomFieldsOptions = {},
	): Promise<Enrollment> {
		if (options.override) {
			return this.update({ customFields: fields });
		}
		const current = await this.get();
		return this.update({
			customFields: { ...current.customFields, ...fields },
		});
	}
}
