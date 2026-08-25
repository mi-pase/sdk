import type { ObjectId, Timestamps } from "./common";

export type TemplateType = "event" | "generic" | "loyalty";

export interface Template extends Timestamps {
	_id: ObjectId;
	domain: string;
	name: string;
	type: TemplateType;
	description?: string;
	/** External template ID in the passes microservice (Jano), once synced. */
	external_template_id?: string;
	deletedAt?: string;
}

export interface CreateTemplateInput {
	domain: string;
	name: string;
	type: TemplateType;
	description?: string;
	external_template_id?: string;
}

export type UpdateTemplateInput = Partial<
	Omit<CreateTemplateInput, "domain" | "type">
>;

export interface ListTemplatesParams {
	domain?: string;
}

/** Apple Wallet pass configuration (ApplePass schema) — passed through as-is. */
export type ApplePassConfig = Record<string, unknown>;
/** Google Wallet class configuration (GoogleClass schema) — passed through as-is. */
export type GooglePassConfig = Record<string, unknown>;

export interface SaveTemplateConfigInput {
	apple: ApplePassConfig;
	google: GooglePassConfig;
}

export interface SaveTemplateConfigResult {
	external_template_id: string;
}

/** Fetched live from the Jano microservice; `null` if the template has no
 *  `external_template_id` yet. Shape is best-effort and may include fields
 *  beyond apple/google. */
export interface TemplateConfig {
	apple?: ApplePassConfig;
	google?: GooglePassConfig;
	[key: string]: unknown;
}
