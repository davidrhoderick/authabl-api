import { createMiddleware } from "hono/factory";
import type { ClientMetadata, ClientValue } from "../clients/types";
import { CLIENT_PREFIX } from "../common/constants";
import type { Bindings } from "../common/types";
import { UnauthorizedError } from "../common/utils";
import type { MiddlewareHandler } from "hono";

export const clientAuthenticationMiddleware: MiddlewareHandler<{
  Bindings: Bindings;
}> = async (c, next) => {
  const clientId = c.req.param("clientId");
  const clientSecret = c.req.header("X-AUTHABL-API-KEY");

  const response = await c.env.KV.getWithMetadata<ClientValue, ClientMetadata>(
    `${CLIENT_PREFIX}:${clientId}`,
    "json",
  );

  if (response.value === null || response.metadata?.secret !== clientSecret)
    throw UnauthorizedError;

  await next();
};

export const clientAuthentication = createMiddleware<{ Bindings: Bindings }>(
  clientAuthenticationMiddleware,
);
