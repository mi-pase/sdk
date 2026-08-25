// @ts-check
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["dist/**"],
	},
	...tseslint.configs.recommended,
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/consistent-type-imports": "error",
		},
	},
);
