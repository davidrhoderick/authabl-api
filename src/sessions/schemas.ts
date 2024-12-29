import { z } from "@hono/zod-openapi";

export const SessionsSchema = z
  .array(
    z.object({
      id: z.string().trim().min(1),
      userAgent: z.string().trim().min(1),
      loggedInAt: z.string().datetime(),
      ip: z.string().ip(),
      expiresAt: z.string().datetime(),
      currentSession: z.boolean(),
    })
  )
  .openapi("Sessions");

export const ClearSessionParamsSchema = z.object({
  sessionId: z.string().trim().min(1),
});
