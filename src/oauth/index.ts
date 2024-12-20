import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  clearSession,
  clearSessions,
  listSessions,
  logoutRoute,
  refreshRoute,
  tokenRoute,
  validateRoute,
} from "./routes";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app
  .openapi(tokenRoute, async (c) => {
    const { clientId, clientSecret, email, password } = c.req.valid("json");

    console.log(clientId, clientSecret, email, password);

    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(refreshRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(logoutRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(validateRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(listSessions, async (c) => {
    return c.json([], 200);
  })
  .openapi(clearSession, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(clearSessions, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  });

export default app;
