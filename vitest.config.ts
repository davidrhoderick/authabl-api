import { resolve } from "node:path";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

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
      reporter: ["html", "lcovonly"],
      clean: false,
    },
    alias: {
      hyperid: resolve("./mocks/hyperid.ts"),
    },
  },
});
