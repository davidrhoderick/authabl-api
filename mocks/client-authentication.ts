import { createMiddleware } from "hono/factory";
import type { Bindings } from "../src/common/types";

export const clientAuthentication = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    await next();
  },
);
