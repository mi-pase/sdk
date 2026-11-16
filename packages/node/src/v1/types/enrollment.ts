import type { ObjectId, Timestamps } from "./common";

/** Download activity for one wallet platform, summarized from the enrollment's
 *  issued pass. */
export interface PlatformDownloadSummary {
	/** Number of times the pass was served/downloaded for this platform. */
	count: number;
	/** ISO timestamp of the most recent download for this platform, or `null`
	 *  if it has never been downloaded. */
	lastAt: string | null;
}

/** Compact summary of how often an enrollment's pass has been downloaded,
 *  across both wallet platforms. Always present on enrollment responses — all
 *  counts are `0` and timestamps `null` when the pass has never been
 *  downloaded (or has not been issued yet). This reflects *downloads* (the
 *  pass file/save URL being served), not confirmed wallet installations. */
export interface PassDownloadSummary {
	/** Total downloads across both platforms (`apple.count + google.count`). */
	total: number;
	/** ISO timestamp of the most recent download across either platform, or
	 *  `null` if never downloaded. */
	lastDownloadedAt: string | null;
	apple: PlatformDownloadSummary;
	google: PlatformDownloadSummary;
}

export interface Enrollment extends Timestamps {
	_id: ObjectId;
	domain: string;
	person: ObjectId;
	project: ObjectId;
	/** Values for the project's custom field definitions, keyed by field key.
	 *  A value is a string for `text`/`date` fields, or a `string[]` for
	 *  `list` fields. */
	customFields: Record<string, string | string[]>;
	integrationInstance?: ObjectId;
	externalId?: string;
	/** Public download-page URL for this enrollment's issued pass — open it on a
	 *  phone to add the pass to Apple/Google Wallet. Present only once a pass has
	 *  been issued; omitted while issuance is pending/failed or the pass was
	 *  revoked. Returned on both the get-one and list endpoints. */
	downloadUrl?: string;
	/** Per-platform download summary for the issued pass. See
	 *  {@link PassDownloadSummary}. */
	downloads: PassDownloadSummary;
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
	/** Keyed by field key. A value is a string for `text`/`date` fields, or a
	 *  `string[]` for `list` fields. */
	customFields?: Record<string, string | string[]>;
}

export interface UpdateEnrollmentInput {
	/** Full replacement of customFields — see `EnrollmentResource.setCustomFields`
	 *  for a merge-friendly alternative. A value is a string for `text`/`date`
	 *  fields, or a `string[]` for `list` fields. */
	customFields?: Record<string, string | string[]>;
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
