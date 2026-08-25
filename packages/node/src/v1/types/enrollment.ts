import type { ObjectId, Timestamps } from "./common";

export interface Enrollment extends Timestamps {
	_id: ObjectId;
	domain: string;
	person: ObjectId;
	project: ObjectId;
	/** Values for the project's custom field definitions, keyed by field key. */
	customFields: Record<string, string>;
	integrationInstance?: ObjectId;
	externalId?: string;
	deletedAt?: string;
}

export interface CreateEnrollmentInput {
	domain: string;
	/** Project ID to enroll the person into. */
	project_id: string;
	/** Full name of the person. */
	name: string;
	/** Used to deduplicate persons within the domain. */
	email?: string;
	phone?: string;
	customFields?: Record<string, string>;
}

export interface UpdateEnrollmentInput {
	/** Full replacement of customFields — see `EnrollmentResource.setCustomFields`
	 *  for a merge-friendly alternative. */
	customFields?: Record<string, string>;
}

export interface ListEnrollmentsParams {
	project?: string;
	person?: string;
	domain?: string;
}

/** A row within a bulk-enroll request. `domain`/`project_id` default to the
 *  batch's top-level values when omitted. */
export type BulkEnrollRowInput = Omit<
	CreateEnrollmentInput,
	"domain" | "project_id"
> &
	Partial<Pick<CreateEnrollmentInput, "domain" | "project_id">>;

export interface BulkEnrollInput {
	domain: string;
	project_id: string;
	rows: BulkEnrollRowInput[];
}

export interface BulkEnrollResult {
	created: number;
	skipped: number;
}

export interface CopyEnrollmentsInput {
	sourceProjectId: string;
	targetProjectId: string;
	domain: string;
}

export interface CopyEnrollmentsResult {
	copied: number;
	failed: number;
}
