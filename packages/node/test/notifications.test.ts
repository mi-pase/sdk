import { describe, expect, it } from "vitest";
import { HttpClient } from "../src/http";
import { NotificationsResource } from "../src/v1/resources/notifications.resource";
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
	return { notifications: new NotificationsResource(http), calls };
}

describe("NotificationsResource.send", () => {
	it("POSTs the shared message plus per-platform and enrollment filters", async () => {
		const { notifications, calls } = resource([
			{ status: 201, body: { _id: "ntf_1", status: "sent" } },
		]);

		await notifications.send({
			domain: "acme",
			project: "prj_1",
			message: "Doors open at 7pm",
			appleMessage: "Doors open at 7pm",
			googleMessage: 'Doors open at 7pm <a href="https://acme.test">Map</a>',
			enrollmentIds: ["enr_1", "enr_2"],
			issuedFrom: "2026-01-01",
			issuedTo: "2026-01-31",
		});

		expect(calls[0]!.method).toBe("POST");
		expect(calls[0]!.url).toBe("https://app.mi-pase.ar/api/notifications");
		expect(calls[0]!.body).toEqual({
			domain: "acme",
			project: "prj_1",
			message: "Doors open at 7pm",
			appleMessage: "Doors open at 7pm",
			googleMessage: 'Doors open at 7pm <a href="https://acme.test">Map</a>',
			enrollmentIds: ["enr_1", "enr_2"],
			issuedFrom: "2026-01-01",
			issuedTo: "2026-01-31",
		});
	});

	it("is not retried automatically (POST)", async () => {
		const { notifications, calls } = resource([
			{ status: 503, body: { message: "unavailable" } },
		]);

		await expect(
			notifications.send({ domain: "acme", project: "prj_1", message: "hi" }),
		).rejects.toMatchObject({ status: 503 });
		expect(calls).toHaveLength(1);
	});
});

describe("NotificationsResource.list", () => {
	it("GETs by domain", async () => {
		const { notifications, calls } = resource([{ status: 200, body: [] }]);

		await notifications.list({ domain: "acme" });

		expect(calls[0]!.method).toBe("GET");
		expect(calls[0]!.url).toBe(
			"https://app.mi-pase.ar/api/notifications?domain=acme",
		);
	});
});

describe("NotificationsResource.listByPasses", () => {
	it("GETs with a comma-joined passes query", async () => {
		const { notifications, calls } = resource([{ status: 200, body: [] }]);

		await notifications.listByPasses(["pass_1", "pass_2"]);

		expect(calls[0]!.url).toBe(
			"https://app.mi-pase.ar/api/notifications?passes=pass_1%2Cpass_2",
		);
	});

	it("short-circuits to [] without a request for an empty list", async () => {
		const { notifications, calls } = resource([{ status: 200, body: [] }]);

		await expect(notifications.listByPasses([])).resolves.toEqual([]);
		expect(calls).toHaveLength(0);
	});
});

describe("NotificationsResource.preview", () => {
	it("maps enrollmentIds to the comma-joined `enrollments` query param", async () => {
		const { notifications, calls } = resource([
			{ status: 200, body: { count: 3, cooldownUntil: null } },
		]);

		const result = await notifications.preview({
			domain: "acme",
			project: "prj_1",
			enrollmentIds: ["enr_1", "enr_2"],
			issuedFrom: "2026-01-01",
		});

		expect(calls[0]!.method).toBe("GET");
		const url = new URL(calls[0]!.url);
		expect(url.pathname).toBe("/api/notifications/preview");
		expect(url.searchParams.get("domain")).toBe("acme");
		expect(url.searchParams.get("project")).toBe("prj_1");
		expect(url.searchParams.get("enrollments")).toBe("enr_1,enr_2");
		expect(url.searchParams.get("issuedFrom")).toBe("2026-01-01");
		expect(result).toEqual({ count: 3, cooldownUntil: null });
	});

	it("omits the `enrollments` param when no enrollmentIds are given", async () => {
		const { notifications, calls } = resource([
			{ status: 200, body: { count: 0, cooldownUntil: null } },
		]);

		await notifications.preview({ domain: "acme", project: "prj_1" });

		const url = new URL(calls[0]!.url);
		expect(url.searchParams.has("enrollments")).toBe(false);
	});
});
