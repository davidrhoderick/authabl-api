import { z } from "@hono/zod-openapi";

export const SessionsSchema = z
  .array(
    z.object({
      id: z.string().trim().min(1),
      createdAt: z.number(),
      currentSession: z.boolean(),
      // Let's make this required
      ip: z.string().ip().optional(),
      // Let's make this required
      userAgent: z.string().trim().min(1).optional(),
      // Let's make this required
      expiresAt: z.number().optional(),
    })
  )
  .openapi("Sessions");

export const ClearSessionParamsSchema = z.object({
  sessionId: z.string().trim().min(1),
});
