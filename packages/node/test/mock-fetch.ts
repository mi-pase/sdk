import { vi } from "vitest";

export interface MockCall {
	url: string;
	method: string;
	headers: Headers;
	body: unknown;
}

export interface MockResponseSpec {
	status?: number;
	body?: unknown;
	headers?: Record<string, string>;
}

/**
 * Builds a `fetch`-compatible mock. `responses` is consumed in order for
 * each call; the last entry repeats once exhausted.
 */
export function mockFetch(responses: MockResponseSpec[]) {
	const calls: MockCall[] = [];
	let index = 0;

	const fetchMock = vi.fn(
		async (input: string | URL, init?: RequestInit) => {
			const spec = responses[Math.min(index, responses.length - 1)]!;
			index++;

			calls.push({
				url: String(input),
				method: init?.method ?? "GET",
				headers: new Headers(init?.headers),
				body: init?.body ? JSON.parse(init.body as string) : undefined,
			});

			return new Response(
				spec.body !== undefined ? JSON.stringify(spec.body) : "",
				{
					status: spec.status ?? 200,
					headers: spec.headers,
				},
			);
		},
	);

	return { fetchMock: fetchMock as unknown as typeof fetch, calls };
}
