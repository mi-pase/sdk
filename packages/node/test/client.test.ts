import { describe, expect, it } from "vitest";
import { MiPaseClient } from "../src/client";
import { mockFetch } from "./mock-fetch";

function testClient(responses: Parameters<typeof mockFetch>[0]) {
	const { fetchMock, calls } = mockFetch(responses);
	const client = new MiPaseClient({
		apiKey: "test-key",
		fetch: fetchMock,
		maxRetries: 0,
	});
	return { client, calls };
}

describe("MiPaseClient", () => {
	it("throws without an apiKey", () => {
		expect(() => new MiPaseClient({ apiKey: "" })).toThrow(/apiKey/);
	});

	it("chains client.project(id).enrollment(id).setCustomFields(...)", async () => {
		const { client, calls } = testClient([
			{ status: 200, body: { _id: "reward_1" } },
		]);

		await client
			.project("proj_1")
			.enrollment("enr_1")
			.setCustomFields({ seat: "12A" }, { override: true });

		expect(calls[0]!.url).toBe(
			"https://app.mi-pase.ar/api/enrollments/enr_1",
		);
		expect(calls[0]!.method).toBe("PUT");
	});

	it("scopes project(id).rewards to the project's URL", async () => {
		const { client, calls } = testClient([
			{ status: 200, body: { _id: "reward_1", name: "Free coffee" } },
		]);

		await client.project("proj_1").rewards.create({
			name: "Free coffee",
			pointsRequired: 100,
		});

		expect(calls[0]!.url).toBe(
			"https://app.mi-pase.ar/api/projects/proj_1/rewards",
		);
	});

	it("scopes project(id).enrollments.create to auto-fill project_id", async () => {
		const { client, calls } = testClient([
			{ status: 200, body: { _id: "enr_1" } },
		]);

		await client.project("proj_1").enrollments.create({
			domain: "acme",
			name: "Jane Doe",
		});

		expect(calls[0]!.body).toMatchObject({ project_id: "proj_1" });
	});

	it("defaults to the production base URL", async () => {
		const { client, calls } = testClient([{ status: 200, body: [] }]);
		await client.projects.list();
		expect(calls[0]!.url.startsWith("https://app.mi-pase.ar/")).toBe(
			true,
		);
	});

	it("rejects unsupported apiVersion values", () => {
		expect(
			() =>
				new MiPaseClient({
					apiKey: "test-key",
					// @ts-expect-error -- only "v1" is valid today
					apiVersion: "v2",
				}),
		).toThrow(/Unsupported apiVersion/);
	});
});
