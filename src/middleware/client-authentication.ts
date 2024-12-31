import { createMiddleware } from "hono/factory";
import { ClientMetadata, ClientValue } from "../clients/types";
import { Bindings } from "../common/types";
import { CLIENT_PREFIX } from "../common/constants";

export const clientAuthentication = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    const clientId = c.req.param("clientId");
    const clientSecret = c.req.header("X-OAUTHABL-API-KEY");

    try {
      const response = await c.env.KV.getWithMetadata<
        ClientValue,
        ClientMetadata
      >(`${CLIENT_PREFIX}:${clientId}`, "json");

      if (
        response.value === null ||
        response.metadata?.secret !== clientSecret
      ) {
        c.res = new Response(
          JSON.stringify({ code: 401, message: "Unauthorized" }),
          { status: 401 }
        );
      }
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }

    await next();
  }
);
