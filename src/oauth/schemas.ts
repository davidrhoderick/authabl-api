import { z } from "@hono/zod-openapi";
import { zodRequiredString } from "../common/schemas";

export const TokenBodySchema = z
  .object({
    clientId: zodRequiredString(),
    clientSecret: zodRequiredString(),
    email: zodRequiredString(),
    password: zodRequiredString(),
  })
  .openapi("TokenRequest");

export const SessionsSchema = z
  .array(
    z.object({
      id: zodRequiredString(),
      userAgent: zodRequiredString(),
      loggedInAt: z.string().datetime(),
      ip: z.string().ip(),
      expiresAt: z.string().datetime(),
      currentSession: z.boolean(),
    })
  )
  .openapi("Sessions");
