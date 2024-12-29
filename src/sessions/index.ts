import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  clearSessionRoute,
  clearSessionsRoute,
  listSessionsRoute,
} from "./routes";
import { clientAuthentication } from "../middleware/client-authentication";
import { SESSION_PREFIX } from "../common/constants";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(listSessionsRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    const prefix = `${SESSION_PREFIX}:${clientId}:${userId}`;

    const sessions = await c.env.OAUTHABL.list({
      prefix,
    });

    return c.json(
      sessions.keys.map(({ name, ...rest }) => ({
        id: name.substring(prefix.length + 1),
        ...rest,
      })),
      200
    );
  })
  .openapi(clearSessionRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(clearSessionsRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  });

export default app;
