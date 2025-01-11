import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { ClientMetadata, ClientValue } from "../clients/types";
import { CLIENT_PREFIX } from "../common/constants";
import type { Bindings } from "../common/types";

export const clientAuthentication = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    const clientId = c.req.param("clientId");
    const clientSecret = c.req.header("X-AUTHABL-API-KEY");

    const response = await c.env.KV.getWithMetadata<
      ClientValue,
      ClientMetadata
    >(`${CLIENT_PREFIX}:${clientId}`, "json");

    if (response.value === null || response.metadata?.secret !== clientSecret)
      throw new HTTPException(401, {
        res: new Response(
          JSON.stringify({ code: 401, message: "Unauthorized" }),
          {
            status: 401,
            headers: { "Content-Type": "application.json" },
          },
        ),
      });

    await next();
  },
);
