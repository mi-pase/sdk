import { MiPaseApiError, MiPaseNetworkError, MiPaseTimeoutError } from "./errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type QueryValue = string | number | boolean | undefined;

export interface RequestOptions {
	/** Query string parameters. `undefined` values are omitted. */
	query?: Record<string, QueryValue>;
	/** Abort signal supplied by the caller, merged with the client's timeout. */
	signal?: AbortSignal;
	/**
	 * Override whether this request is safe to retry on 429/5xx/network errors.
	 * Defaults to `true` for GET/PUT/DELETE and `false` for POST, since POST
	 * usually creates a resource and blindly retrying it can create duplicates.
	 */
	idempotent?: boolean;
}

export interface HttpClientOptions {
	baseUrl: string;
	apiKey: string;
	timeoutMs: number;
	maxRetries: number;
	fetch: typeof fetch;
	userAgent: string;
}

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

function isRetryableMethod(method: HttpMethod, override?: boolean): boolean {
	if (override !== undefined) return override;
	return method !== "POST";
}

function buildUrl(
	baseUrl: string,
	path: string,
	query?: Record<string, QueryValue>,
): string {
	const url = new URL(path, baseUrl);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined) url.searchParams.set(key, String(value));
		}
	}
	return url.toString();
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with full jitter: rand(0, min(cap, base * 2^attempt)). */
function backoffDelayMs(attempt: number): number {
	const base = 300;
	const cap = 4000;
	return Math.random() * Math.min(cap, base * 2 ** attempt);
}

export class HttpClient {
	constructor(private readonly options: HttpClientOptions) {}

	get<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("GET", path, undefined, options);
	}

	post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return this.request<T>("POST", path, body, options);
	}

	put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
		return this.request<T>("PUT", path, body, options);
	}

	delete<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("DELETE", path, undefined, options);
	}

	async request<T>(
		method: HttpMethod,
		path: string,
		body: unknown,
		options: RequestOptions = {},
	): Promise<T> {
		const url = buildUrl(this.options.baseUrl, path, options.query);
		const retryEligible = isRetryableMethod(method, options.idempotent);
		const maxAttempts = retryEligible ? this.options.maxRetries + 1 : 1;

		let lastError: unknown;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			if (attempt > 0) await sleep(backoffDelayMs(attempt - 1));

			try {
				return await this.attempt<T>(method, url, body, options.signal);
			} catch (error) {
				lastError = error;
				const shouldRetry =
					attempt < maxAttempts - 1 &&
					(error instanceof MiPaseNetworkError ||
						error instanceof MiPaseTimeoutError ||
						(error instanceof MiPaseApiError &&
							RETRYABLE_STATUS_CODES.has(error.status)));
				if (!shouldRetry) throw error;
			}
		}
		throw lastError;
	}

	private async attempt<T>(
		method: HttpMethod,
		url: string,
		body: unknown,
		externalSignal?: AbortSignal,
	): Promise<T> {
		const controller = new AbortController();
		const timeout = setTimeout(
			() => controller.abort(new MiPaseTimeoutError(this.options.timeoutMs)),
			this.options.timeoutMs,
		);
		const onExternalAbort = () => controller.abort(externalSignal?.reason);
		externalSignal?.addEventListener("abort", onExternalAbort);

		try {
			let response: Response;
			try {
				response = await this.options.fetch(url, {
					method,
					headers: {
						Authorization: `Bearer ${this.options.apiKey}`,
						Accept: "application/json",
						"User-Agent": this.options.userAgent,
						...(body !== undefined
							? { "Content-Type": "application/json" }
							: {}),
					},
					body: body !== undefined ? JSON.stringify(body) : undefined,
					signal: controller.signal,
				});
			} catch (error) {
				if (controller.signal.aborted && controller.signal.reason instanceof MiPaseTimeoutError) {
					throw controller.signal.reason;
				}
				if (controller.signal.aborted && externalSignal?.aborted) {
					throw error;
				}
				throw new MiPaseNetworkError(error);
			}

			return await this.parseResponse<T>(response);
		} finally {
			clearTimeout(timeout);
			externalSignal?.removeEventListener("abort", onExternalAbort);
		}
	}

	private async parseResponse<T>(response: Response): Promise<T> {
		const requestId = response.headers.get("x-request-id") ?? undefined;
		const text = await response.text();
		const data = text ? safeJsonParse(text) : undefined;

		if (!response.ok) {
			throw new MiPaseApiError(response.status, data, requestId);
		}

		return data as T;
	}
}

function safeJsonParse(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
