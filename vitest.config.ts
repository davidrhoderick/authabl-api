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
      '../middleware/superadmin-authentication': resolve('./mocks/superadmin-authentication.ts'),
      '../middleware/client-authentication': resolve('./mocks/client-authentication.ts')
    },
  },
});
