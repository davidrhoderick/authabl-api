import { z } from "@hono/zod-openapi";
import { ClientIdUserIdParamSchema } from "../common/schemas";

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

export const GetSessionParamsSchema = ClientIdUserIdParamSchema.extend({
  sessionId: z.string().trim().min(1),
});

export const GetSessionResponseSchema = z.object({
  session: z.object({
    id: z.string().trim().min(1),
    createdAt: z.number(),
  }),
  accessTokens: z.array(
    z.object({
      id: z.string().trim().min(1),
      userId: z.string().trim().min(1),
      clientId: z.string().trim().min(1),
      expiresAt: z.number(),
      accessTokenValidity: z.number(),
      current: z.boolean(),
    })
  ),
  refreshTokens: z.array(
    z.object({
      id: z.string().trim().min(1),
      userId: z.string().trim().min(1),
      clientId: z.string().trim().min(1),
      expiresAt: z.number(),
      refreshTokenValidity: z.number(),
      current: z.boolean(),
    })
  ),
});

export const ClearSessionParamsSchema = z.object({
  sessionId: z.string().trim().min(1),
});
