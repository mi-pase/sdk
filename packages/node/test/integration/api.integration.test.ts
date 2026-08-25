import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MiPaseClient, MiPaseApiError, isScanAmbiguous } from "../../src";
import type { Project } from "../../src";

/**
 * Exercises every SDK method against a real mi-pase deployment.
 *
 * Requires:
 *   MI_PASE_TEST_API_KEY  — Organization API key for the test org (required)
 *   MI_PASE_TEST_DOMAIN   — that org's domain/slug (default: "ci-testing")
 *   MI_PASE_TEST_BASE_URL — API base URL (default: the SDK's production default)
 *
 * Skipped entirely when MI_PASE_TEST_API_KEY isn't set, so `npm test` stays
 * safe to run without credentials (e.g. in PRs from forks).
 *
 * The test org's plan allows only one *active* kind="project" event at a
 * time (a 403 "Límite de eventos activos alcanzado" otherwise), so the whole
 * suite shares a single kind="project" fixture instead of each test creating
 * its own. Tests that need an extra concurrently-active project use
 * kind="program" instead, which isn't subject to that limit.
 */
const apiKey = process.env.MI_PASE_TEST_API_KEY;
const baseUrl = process.env.MI_PASE_TEST_BASE_URL;
const domain = process.env.MI_PASE_TEST_DOMAIN ?? "ci-testing";
const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe.skipIf(!apiKey)("integration: mi-pase API (live)", () => {
	// describe.skipIf still runs this body during collection even when the
	// suite is skipped, so this must not throw — MiPaseClient requires a
	// non-empty apiKey, but the tests below never actually run without one.
	const client = new MiPaseClient({
		apiKey: apiKey ?? "unused-because-suite-is-skipped",
		baseUrl,
	});

	const cleanup: { projectIds: string[]; templateIds: string[] } = {
		projectIds: [],
		templateIds: [],
	};
	let project: Project;

	beforeAll(async () => {
		project = await client.projects.create({
			domain,
			name: `sdk-ci-project-${runId}`,
			// Enrolling requires the project to have a pass design configured.
			applePassDesign: {
				backgroundColor: { type: "static", value: "#FFFFFF" },
			},
		});
		cleanup.projectIds.push(project._id);
	});

	afterAll(async () => {
		const results = await Promise.allSettled([
			...cleanup.templateIds.map((id) => client.template(id).delete()),
			...cleanup.projectIds.map(async (id) => {
				await client.project(id).update({ status: "finalized" });
				await client.project(id).delete();
			}),
		]);
		for (const result of results) {
			if (result.status === "rejected") {
				console.warn("Integration test cleanup failed:", result.reason);
			}
		}
	});

	it("GET /api/health", async () => {
		const health = await client.health();
		expect(health.status).toBe("ok");
		expect(typeof health.timestamp).toBe("string");
	});

	it("project CRUD: get, list, update", async () => {
		expect(project.domain).toBe(domain);
		expect(project.status).toBe("active");

		const list = await client.projects.list({ domain });
		expect(list.some((p) => p._id === project._id)).toBe(true);

		const fetched = await client.project(project._id).get();
		expect(fetched._id).toBe(project._id);

		const updated = await client
			.project(project._id)
			.update({ description: "updated by CI" });
		expect(updated.description).toBe("updated by CI");
	});

	it("project duplicate (kind=program, so it doesn't compete for the active-events slot)", async () => {
		const original = await client.projects.create({
			domain,
			name: `sdk-ci-duplicate-source-${runId}`,
			kind: "program",
		});
		const duplicate = await client.project(original._id).duplicate();
		expect(duplicate._id).not.toBe(original._id);
		// The API prefixes duplicated project names with "Copy of ".
		expect(duplicate.name).toBe(`Copy of ${original.name}`);

		for (const id of [original._id, duplicate._id]) {
			await client.project(id).update({ status: "finalized" });
			await client.project(id).delete();
		}
	});

	it("reward lifecycle within a project", async () => {
		const rewardProject = await client.projects.create({
			domain,
			name: `sdk-ci-rewards-${runId}`,
			kind: "program",
		});
		cleanup.projectIds.push(rewardProject._id);

		const reward = await client.project(rewardProject._id).rewards.create({
			name: "CI reward",
			pointsRequired: 10,
		});
		expect(reward.pointsRequired).toBe(10);

		const list = await client.project(rewardProject._id).rewards.list();
		expect(list.some((r) => r._id === reward._id)).toBe(true);

		const updated = await client
			.project(rewardProject._id)
			.rewards.update(reward._id, { pointsRequired: 20 });
		expect(updated.pointsRequired).toBe(20);

		const deleted = await client
			.project(rewardProject._id)
			.rewards.delete(reward._id);
		expect(deleted._id).toBe(reward._id);
	});

	it("enrollment lifecycle: create, merge/override custom fields, list, delete", async () => {
		const enrollment = await client.project(project._id).enrollments.create({
			domain,
			name: "CI Test Person",
			email: `sdk-ci-${runId}@example.com`,
			customFields: { seat: "1A" },
		});
		expect(enrollment.customFields).toEqual({ seat: "1A" });

		const merged = await client
			.project(project._id)
			.enrollment(enrollment._id)
			.setCustomFields({ gate: "B2" });
		expect(merged.customFields).toMatchObject({ seat: "1A", gate: "B2" });

		const replaced = await client
			.enrollment(enrollment._id)
			.setCustomFields({ seat: "2B" }, { override: true });
		expect(replaced.customFields).toEqual({ seat: "2B" });

		const list = await client.enrollments.list({ project: project._id });
		expect(list.some((e) => e._id === enrollment._id)).toBe(true);

		const deleted = await client.enrollment(enrollment._id).delete();
		expect(deleted._id).toBe(enrollment._id);
	});

	it("bulk-enrolls and copies enrollments to a program", async () => {
		const target = await client.projects.create({
			domain,
			name: `sdk-ci-bulk-target-${runId}`,
			kind: "program",
		});
		cleanup.projectIds.push(target._id);

		const bulkResult = await client
			.project(project._id)
			.enrollments.bulkCreate({
				domain,
				rows: [
					{ name: "Bulk One", email: `sdk-ci-bulk1-${runId}@example.com` },
					{ name: "Bulk Two", email: `sdk-ci-bulk2-${runId}@example.com` },
				],
			});
		expect(bulkResult.created).toBe(2);
		expect(bulkResult.skipped).toBe(0);

		const copyResult = await client.enrollments.copyToProject({
			sourceProjectId: project._id,
			targetProjectId: target._id,
			domain,
		});
		expect(copyResult.copied).toBe(2);
		expect(copyResult.failed).toBe(0);

		const targetEnrollments = await client
			.project(target._id)
			.enrollments.list();
		expect(targetEnrollments).toHaveLength(2);
	});

	it("template lifecycle: create, list, get, update, config, duplicate, delete", async () => {
		const template = await client.templates.create({
			domain,
			name: `sdk-ci-template-${runId}`,
			type: "generic",
		});
		cleanup.templateIds.push(template._id);
		expect(template.type).toBe("generic");

		const list = await client.templates.list({ domain });
		expect(list.some((t) => t._id === template._id)).toBe(true);

		const fetched = await client.template(template._id).get();
		expect(fetched._id).toBe(template._id);

		const updated = await client
			.template(template._id)
			.update({ description: "updated by CI" });
		expect(updated.description).toBe("updated by CI");

		// No external_template_id yet — the API responds with an empty body
		// rather than a JSON null, so the SDK resolves this as undefined.
		const config = await client.template(template._id).getConfig();
		expect(config).toBeUndefined();

		const duplicate = await client.template(template._id).duplicate();
		expect(duplicate._id).not.toBe(template._id);
		cleanup.templateIds.push(duplicate._id);

		const deleted = await client.template(duplicate._id).delete();
		expect(deleted._id).toBe(duplicate._id);
		cleanup.templateIds = cleanup.templateIds.filter(
			(id) => id !== duplicate._id,
		);
	});

	it("validator lifecycle: create, list, scan, records, delete", async () => {
		const validator = await client.validators.create({
			domain,
			name: `sdk-ci-validator-${runId}`,
			project: project._id,
			scanMode: "camera",
		});
		// The API always returns `project` populated as a full Project document.
		expect(validator.project._id).toBe(project._id);

		const list = await client.validators.list({ domain });
		expect(list.some((v) => v._id === validator._id)).toBe(true);

		const fetched = await client.validator(validator._id).get();
		expect(fetched._id).toBe(validator._id);

		const updated = await client
			.validator(validator._id)
			.update({ scanMode: "both" });
		expect(updated.scanMode).toBe("both");

		// No enrollment matches this scanned value — expect an "invalid" record.
		const scanResult = await client.validator(validator._id).scan({
			scannedValue: `does-not-exist-${runId}`,
			scanMode: "camera",
		});
		expect(isScanAmbiguous(scanResult)).toBe(false);
		if (!isScanAmbiguous(scanResult)) {
			expect(scanResult.status).toBe("invalid");
		}

		const records = await client
			.validator(validator._id)
			.records({ limit: 10 });
		expect(records.total).toBeGreaterThanOrEqual(1);

		const recordsForEmptySet =
			await client.validators.recordsForEnrollments([]);
		expect(recordsForEmptySet).toEqual([]);

		const deleted = await client.validator(validator._id).delete();
		expect(deleted).toEqual({ deleted: true });
	});

	it("surfaces a 404 as MiPaseApiError", async () => {
		await expect(
			client.project("000000000000000000000000").get(),
		).rejects.toBeInstanceOf(MiPaseApiError);
	});
});
