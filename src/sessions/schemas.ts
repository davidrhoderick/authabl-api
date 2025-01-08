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
    }),
  )
  .openapi("Sessions");

export const TokenPayloadSchema = z.object({
  sub: z.string().trim().min(1),
  iss: z.literal("oauthabl"),
  exp: z.number().int(),
  aud: z.string().trim().min(1),
  iat: z.number().int(),
  type: z.literal("access").or(z.literal("refresh")),
  sid: z.string().trim().min(1),
  role: z.string().trim().min(1),
});

export const ArchivedSessionSchema = z
  .object({
    id: z.string().trim().min(1),
    createdAt: z.number().int(),
    deletedAt: z.number().int(),
    accessTokens: z.array(TokenPayloadSchema),
    refreshTokens: z.array(TokenPayloadSchema),
  })
  .openapi("ArchivedSession");

export const ArchivedSessionsSchema = z.array(ArchivedSessionSchema);

export const GetSessionParamsSchema = ClientIdUserIdParamSchema.extend({
  sessionId: z.string().trim().min(1),
});

export const RefreshTokenQuery = z.object({
  refreshToken: z.string().trim().min(1).optional(),
});

export const AccessToken = z
  .object({
    id: z.string().trim().min(1),
    createdAt: z.number().int(),
    expiresAt: z.number().int(),
    revokedAt: z.number().int().optional(),
    accessTokenValidity: z.number().int(),
    current: z.boolean(),
  })
  .openapi("AccessToken");

export const RefreshToken = z
  .object({
    id: z.string().trim().min(1),
    createdAt: z.number().int(),
    expiresAt: z.number().int(),
    revokedAt: z.number().int().optional(),
    refreshTokenValidity: z.number().int(),
    current: z.boolean(),
  })
  .openapi("RefreshToken");

export const GetSessionResponseSchema = z.object({
  session: z.object({
    id: z.string().trim().min(1),
    clientId: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    createdAt: z.number(),
  }),
  accessTokens: z.array(AccessToken),
  refreshTokens: z.array(RefreshToken),
});

export const ClearSessionParamsSchema = ClientIdUserIdParamSchema.extend({
  sessionId: z.string().trim().min(1),
});
