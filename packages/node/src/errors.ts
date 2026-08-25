/** Raw error body shape returned by Diamond's Nest.js exception filter. */
interface ApiErrorBody {
	statusCode?: number;
	message?: string | string[];
	error?: string;
	[key: string]: unknown;
}

/**
 * Thrown for any non-2xx response from the mi-pase API.
 * `body` retains the raw parsed response so callers can inspect
 * fields the SDK doesn't model explicitly.
 */
export class MiPaseApiError extends Error {
	readonly status: number;
	readonly code?: string;
	readonly body: unknown;
	readonly requestId?: string;

	constructor(status: number, body: unknown, requestId?: string) {
		super(MiPaseApiError.buildMessage(status, body));
		this.name = "MiPaseApiError";
		this.status = status;
		this.body = body;
		this.requestId = requestId;
		this.code = MiPaseApiError.isErrorBody(body) ? body.error : undefined;
		Object.setPrototypeOf(this, MiPaseApiError.prototype);
	}

	private static isErrorBody(body: unknown): body is ApiErrorBody {
		return typeof body === "object" && body !== null;
	}

	private static buildMessage(status: number, body: unknown): string {
		if (MiPaseApiError.isErrorBody(body) && body.message) {
			return Array.isArray(body.message)
				? body.message.join("; ")
				: body.message;
		}
		return `Request failed with status ${status}`;
	}
}

/** Thrown when a request is aborted by a client-side timeout. */
export class MiPaseTimeoutError extends Error {
	constructor(timeoutMs: number) {
		super(`Request timed out after ${timeoutMs}ms`);
		this.name = "MiPaseTimeoutError";
		Object.setPrototypeOf(this, MiPaseTimeoutError.prototype);
	}
}

/** Thrown for network failures (DNS, connection refused, etc.) that aren't HTTP errors. */
export class MiPaseNetworkError extends Error {
	readonly cause?: unknown;

	constructor(cause: unknown) {
		super(
			`Network request failed: ${cause instanceof Error ? cause.message : String(cause)}`,
		);
		this.name = "MiPaseNetworkError";
		this.cause = cause;
		Object.setPrototypeOf(this, MiPaseNetworkError.prototype);
	}
}
