import { HttpClient } from "./http";
import {
	EnrollmentResource,
	EnrollmentsResource,
	HealthResource,
	ProjectResource,
	ProjectsResource,
	TemplateResource,
	TemplatesResource,
	ValidatorResource,
	ValidatorsResource,
} from "./v1/resources";
import type { HealthStatus } from "./v1/types";

const PACKAGE_VERSION = "0.1.0";
const DEFAULT_BASE_URL = "https://app.mi-pase.ar";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;

/** API versions currently served by the mi-pase API. Only "v1" exists today. */
export type ApiVersion = "v1";

export interface MiPaseClientOptions {
	/**
	 * Clerk Organization API key, created via the API Keys panel in your
	 * mi-pase organization settings. Sent as `Authorization: Bearer <apiKey>`.
	 */
	apiKey: string;
	/** Defaults to the production API, `https://app.mi-pase.ar`. */
	baseUrl?: string;
	/** Per-request timeout in milliseconds. Defaults to 30000. */
	timeoutMs?: number;
	/**
	 * Retries for GET/PUT/DELETE requests that fail with a network error,
	 * a timeout, or a 429/502/503/504 response. POST requests are never
	 * retried automatically. Defaults to 2.
	 */
	maxRetries?: number;
	/** Override the `fetch` implementation (useful for testing or non-standard runtimes). */
	fetch?: typeof fetch;
	/**
	 * Reserved for future use — the mi-pase API only exposes "v1" today.
	 * Passing anything else throws immediately.
	 */
	apiVersion?: ApiVersion;
}

/**
 * Client for the mi-pase API.
 *
 * @example
 * const client = new MiPaseClient({ apiKey: process.env.MI_PASE_API_KEY! });
 *
 * const project = await client.projects.create({ domain: "acme", name: "Summer Fest" });
 * await client.project(project._id).enrollment(enrollmentId).setCustomFields(
 *   { seat: "12A" },
 *   { override: true },
 * );
 */
export class MiPaseClient {
	private readonly http: HttpClient;

	readonly projects: ProjectsResource;
	readonly enrollments: EnrollmentsResource;
	readonly templates: TemplatesResource;
	readonly validators: ValidatorsResource;

	constructor(options: MiPaseClientOptions) {
		if (!options.apiKey) {
			throw new Error(
				"MiPaseClient requires `apiKey` — a Clerk Organization API key from your mi-pase organization settings.",
			);
		}
		if (options.apiVersion !== undefined && options.apiVersion !== "v1") {
			throw new Error(
				`Unsupported apiVersion "${options.apiVersion}". Only "v1" is currently available.`,
			);
		}
		if (!options.fetch && typeof fetch === "undefined") {
			throw new Error(
				"No global `fetch` found. Use Node.js 18+, or pass a `fetch` implementation via options.fetch.",
			);
		}

		this.http = new HttpClient({
			baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
			apiKey: options.apiKey,
			timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
			maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
			fetch: options.fetch ?? fetch,
			userAgent: `mi-pase-sdk-node/${PACKAGE_VERSION}`,
		});

		this.projects = new ProjectsResource(this.http);
		this.enrollments = new EnrollmentsResource(this.http);
		this.templates = new TemplatesResource(this.http);
		this.validators = new ValidatorsResource(this.http);
	}

	/** Address a single project by id. @example client.project(id).get() */
	project(id: string): ProjectResource {
		return new ProjectResource(this.http, id);
	}

	/** Address a single enrollment by id. @example client.enrollment(id).setCustomFields({...}) */
	enrollment(id: string): EnrollmentResource {
		return new EnrollmentResource(this.http, id);
	}

	/** Address a single template by id. @example client.template(id).getConfig() */
	template(id: string): TemplateResource {
		return new TemplateResource(this.http, id);
	}

	/** Address a single validator by id. @example client.validator(id).scan({...}) */
	validator(id: string): ValidatorResource {
		return new ValidatorResource(this.http, id);
	}

	/** GET /api/health */
	health(): Promise<HealthStatus> {
		return new HealthResource(this.http).get();
	}
}
