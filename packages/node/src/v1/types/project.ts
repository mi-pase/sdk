import type { ObjectId, Timestamps } from "./common";
import type {
	GoogleEventPassDesign,
	GoogleGenericPassDesign,
	GoogleLoyaltyPassDesign,
	PassFieldValue,
} from "./pass-design";

export type ProjectKind = "project" | "program";
export type ProjectStatus = "active" | "finalized";
export type CustomFieldType = "text" | "date";

export interface CustomFieldDef {
	/** Unique snake_case key, immutable after creation. Used as the token in
	 *  pass designs and as the property key in `enrollment.customFields`. */
	key: string;
	label: string;
	fieldType: CustomFieldType;
	/** Pass cannot be issued until this field has a value. */
	required: boolean;
	/** Masked in the UI and excluded from general display (e.g. QR/NFC secret). */
	secret: boolean;
}

export interface Project extends Timestamps {
	_id: ObjectId;
	domain: string;
	kind: ProjectKind;
	name: string;
	description?: string;
	template?: ObjectId;
	customFieldDefs: CustomFieldDef[];
	/** Flat map of key → PassFieldValue. Scalar keys are dot/bracket Apple JSON
	 *  paths (e.g. "barcodes[0].message", "backgroundColor"). */
	applePassDesign?: Record<string, PassFieldValue>;
	googleEventPassDesign?: GoogleEventPassDesign;
	googleGenericPassDesign?: GoogleGenericPassDesign;
	googleLoyaltyPassDesign?: GoogleLoyaltyPassDesign;
	autoSendEmail: boolean;
	emailTemplate?: ObjectId;
	status: ProjectStatus;
	/** Public self-registration page enabled at /register/{id} (kind="program" only). */
	publicRegistration: boolean;
	deletedAt?: string;
}

export interface CreateProjectInput {
	domain: string;
	name: string;
	description?: string;
	template?: string;
	customFieldDefs?: Array<
		Pick<CustomFieldDef, "key" | "label"> &
			Partial<Pick<CustomFieldDef, "fieldType" | "required" | "secret">>
	>;
	applePassDesign?: Record<string, PassFieldValue>;
	googleEventPassDesign?: GoogleEventPassDesign;
	googleGenericPassDesign?: GoogleGenericPassDesign;
	googleLoyaltyPassDesign?: GoogleLoyaltyPassDesign;
	autoSendEmail?: boolean;
	emailTemplate?: string;
	status?: ProjectStatus;
	kind?: ProjectKind;
	publicRegistration?: boolean;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface ListProjectsParams {
	/** Scoped to the caller's org for non-admins regardless of this filter. */
	domain?: string;
	kind?: string;
}
