import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { resolve } from "node:path";

export default defineWorkersConfig({
	test: {
		globals: true,
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.toml" },
			},
		},
		coverage: {
			enabled: true,
			provider: "istanbul",
			include: ["src/**/*.ts"],
			reporter: ["html", "lcov"],
			clean: false,
		},
		alias: {
			hyperid: resolve("./mocks/hyperid.ts"),
		},
	},
});
