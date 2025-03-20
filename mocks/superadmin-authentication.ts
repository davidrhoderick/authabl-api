import { createMiddleware } from "hono/factory";
import type { Bindings } from "hono/types";

export const superadminAuthentication = createMiddleware<{
  Bindings: Bindings;
}>(async (c, next) => {
  await next();
});
