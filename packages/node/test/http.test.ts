import { describe, expect, it } from "vitest";
import { HttpClient } from "../src/http";
import { MiPaseApiError, MiPaseNetworkError } from "../src/errors";
import { mockFetch } from "./mock-fetch";

function client(responses: Parameters<typeof mockFetch>[0]) {
	const { fetchMock, calls } = mockFetch(responses);
	const http = new HttpClient({
		baseUrl: "https://app.mi-pase.ar",
		apiKey: "test-key",
		timeoutMs: 5000,
		maxRetries: 2,
		fetch: fetchMock,
		userAgent: "mi-pase-sdk-node/test",
	});
	return { http, calls };
}

describe("HttpClient", () => {
	it("sends the Authorization header and JSON content type", async () => {
		const { http, calls } = client([{ status: 200, body: { ok: true } }]);
		await http.post("/api/projects", { name: "Test" });

		expect(calls[0]!.headers.get("authorization")).toBe(
			"Bearer test-key",
		);
		expect(calls[0]!.headers.get("content-type")).toBe(
			"application/json",
		);
		expect(calls[0]!.body).toEqual({ name: "Test" });
	});

	it("omits Content-Type for bodyless GET requests", async () => {
		const { http, calls } = client([{ status: 200, body: [] }]);
		await http.get("/api/projects");

		expect(calls[0]!.headers.get("content-type")).toBeNull();
	});

	it("serializes query params and skips undefined values", async () => {
		const { http, calls } = client([{ status: 200, body: [] }]);
		await http.get("/api/projects", {
			query: { domain: "acme", kind: undefined },
		});

		const url = new URL(calls[0]!.url);
		expect(url.searchParams.get("domain")).toBe("acme");
		expect(url.searchParams.has("kind")).toBe(false);
	});

	it("throws MiPaseApiError with the parsed body on non-2xx responses", async () => {
		const { http } = client([
			{
				status: 404,
				body: { statusCode: 404, message: "Project x not found" },
			},
		]);

		await expect(http.get("/api/projects/x")).rejects.toMatchObject({
			name: "MiPaseApiError",
			status: 404,
			message: "Project x not found",
		});
	});

	it("joins array-style class-validator messages", async () => {
		const { http } = client([
			{
				status: 400,
				body: { statusCode: 400, message: ["name should not be empty"] },
			},
		]);

		try {
			await http.post("/api/projects", {});
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(MiPaseApiError);
			expect((error as MiPaseApiError).message).toBe(
				"name should not be empty",
			);
		}
	});

	it("retries GET on 503 and eventually succeeds", async () => {
		const { http, calls } = client([
			{ status: 503, body: { message: "unavailable" } },
			{ status: 200, body: { ok: true } },
		]);

		const result = await http.get("/api/projects");
		expect(result).toEqual({ ok: true });
		expect(calls).toHaveLength(2);
	});

	it("does not retry POST by default", async () => {
		const { http, calls } = client([
			{ status: 503, body: { message: "unavailable" } },
			{ status: 200, body: { ok: true } },
		]);

		await expect(http.post("/api/projects", {})).rejects.toBeInstanceOf(
			MiPaseApiError,
		);
		expect(calls).toHaveLength(1);
	});

	it("retries POST when idempotent is explicitly requested", async () => {
		const { http, calls } = client([
			{ status: 502, body: { message: "bad gateway" } },
			{ status: 200, body: { ok: true } },
		]);

		const result = await http.post(
			"/api/validators/1/scan",
			{},
			{ idempotent: true },
		);
		expect(result).toEqual({ ok: true });
		expect(calls).toHaveLength(2);
	});

	it("does not retry on non-retryable 4xx status codes", async () => {
		const { http, calls } = client([
			{ status: 403, body: { message: "forbidden" } },
		]);

		await expect(http.get("/api/projects")).rejects.toBeInstanceOf(
			MiPaseApiError,
		);
		expect(calls).toHaveLength(1);
	});

	it("wraps network failures in MiPaseNetworkError", async () => {
		const http = new HttpClient({
			baseUrl: "https://app.mi-pase.ar",
			apiKey: "test-key",
			timeoutMs: 5000,
			maxRetries: 0,
			fetch: async () => {
				throw new TypeError("fetch failed");
			},
			userAgent: "mi-pase-sdk-node/test",
		});

		await expect(http.get("/api/projects")).rejects.toBeInstanceOf(
			MiPaseNetworkError,
		);
	});
});
