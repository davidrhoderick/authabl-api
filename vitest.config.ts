import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		globals: true,
		poolOptions: {
			workers: {
				main: "./src/index.ts",
				wrangler: { configPath: "./wrangler.toml" },
				miniflare: {
					kvNamespaces: ["OAUTHABL"],
				},
			},
		},
		deps: {
			inline: ['hyperid', './uuid-node']
		}
	},
});
