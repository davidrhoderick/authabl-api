import { z } from "@hono/zod-openapi";
import { zodRequiredString } from "../schemas";

export const TokenBodySchema = z
  .object({
    clientId: zodRequiredString(),
    clientSecret: zodRequiredString(),
    email: zodRequiredString(),
    password: zodRequiredString(),
  })
  .openapi("TokenRequest");

