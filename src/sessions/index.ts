import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  clearSessionRoute,
  clearSessionsRoute,
  listSessionsRoute,
} from "./routes";
import { clientAuthentication } from "../middleware/client-authentication";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("*", clientAuthentication);

app
  .openapi(listSessionsRoute, async (c) => {
    return c.json([], 200);
  })
  .openapi(clearSessionRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(clearSessionsRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  });

export default app;
