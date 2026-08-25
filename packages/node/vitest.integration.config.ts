import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["test/integration/**/*.test.ts"],
		testTimeout: 30_000,
		hookTimeout: 30_000,
		// Fixtures share module-level state and clean up after themselves —
		// running files in parallel risks interleaved cleanup/creation.
		fileParallelism: false,
	},
});
