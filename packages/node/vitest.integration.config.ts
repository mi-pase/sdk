import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["test/integration/**/*.test.ts"],
		// Generous budgets: setup/teardown hit the live API, and creating a
		// template provisions this domain's Google child issuer and syncs to the
		// passes/templates microservices — a chain that can take well over 30s
		// when those Cloud Run services are cold.
		testTimeout: 120_000,
		hookTimeout: 120_000,
		// Fixtures share module-level state and clean up after themselves —
		// running files in parallel risks interleaved cleanup/creation.
		fileParallelism: false,
	},
});
