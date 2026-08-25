import { describe, expect, it } from "vitest";
import { HttpClient } from "../src/http";
import { EnrollmentResource } from "../src/v1/resources/enrollment.resource";
import { mockFetch } from "./mock-fetch";

function resource(responses: Parameters<typeof mockFetch>[0]) {
	const { fetchMock, calls } = mockFetch(responses);
	const http = new HttpClient({
		baseUrl: "https://app.mi-pase.ar",
		apiKey: "test-key",
		timeoutMs: 5000,
		maxRetries: 0,
		fetch: fetchMock,
		userAgent: "mi-pase-sdk-node/test",
	});
	return { enrollment: new EnrollmentResource(http, "enr_1"), calls };
}

describe("EnrollmentResource.setCustomFields", () => {
	it("merges with existing fields by default (fetch then PUT)", async () => {
		const { enrollment, calls } = resource([
			{
				status: 200,
				body: {
					_id: "enr_1",
					customFields: { seat: "10A", gate: "B2" },
				},
			},
			{ status: 200, body: { _id: "enr_1" } },
		]);

		await enrollment.setCustomFields({ seat: "12A" });

		expect(calls[0]!.method).toBe("GET");
		expect(calls[1]!.method).toBe("PUT");
		expect(calls[1]!.body).toEqual({
			customFields: { seat: "12A", gate: "B2" },
		});
	});

	it("replaces customFields wholesale when override is true, skipping the fetch", async () => {
		const { enrollment, calls } = resource([
			{ status: 200, body: { _id: "enr_1" } },
		]);

		await enrollment.setCustomFields({ seat: "12A" }, { override: true });

		expect(calls).toHaveLength(1);
		expect(calls[0]!.method).toBe("PUT");
		expect(calls[0]!.body).toEqual({ customFields: { seat: "12A" } });
	});
});
