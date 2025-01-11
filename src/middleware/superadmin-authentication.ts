import { createMiddleware } from "hono/factory";
import type { ClientMetadata, ClientValue } from "../clients/types";
import { CLIENT_PREFIX, AUTHABL_CLIENTID } from "../common/constants";
import type { Bindings } from "../common/types";
import { detectAccessToken } from "../tokens/utils";
import { HTTPException } from "hono/http-exception";

export const superadminAuthentication = createMiddleware<{
  Bindings: Bindings;
}>(async (c, next) => {
  const clientSecret = c.req.header("X-AUTHABL-API-KEY");

  const response = await c.env.KV.getWithMetadata<ClientValue, ClientMetadata>(
    `${CLIENT_PREFIX}:${AUTHABL_CLIENTID}`,
    "json",
  );

  if (response.value === null || response.metadata?.secret !== clientSecret)
    throw new HTTPException(401, {
      res: new Response(JSON.stringify({code: 401, message: "Unauthorized"}), {
        status: 401,
        headers: { "Content-Type": "application.json" },
      }),
    });

  const accessTokenResult = await detectAccessToken(c);

  if (accessTokenResult?.role !== "superadmin")
    throw new HTTPException(401, {
      res: new Response(JSON.stringify({code: 401, message: "Unauthorized"}), {
        status: 401,
        headers: { "Content-Type": "application.json" },
      }),
    });

  await next();
});
