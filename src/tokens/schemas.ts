import { z } from "@hono/zod-openapi";
import { User, zodPassword, zodUsername } from "../common/schemas";

const TokenPassword = z.object({
  password: zodPassword,
});

export const EmailToken = TokenPassword.extend({
  email: z.string().email().regex(/[^:]*/),
});

export const UsernameToken = TokenPassword.extend({
  username: zodUsername,
});

export const TokenBodySchema = z
  .union([EmailToken, UsernameToken])
  .openapi("TokenRequest");

export const ValidationResponseSchema = z.object({
  userId: z.string().trim().min(1),
  clientId: z.string().trim().min(1),
  expiresAt: z.number().int(),
});

export const MobileTokenResponseSchema = User.extend({
  accessToken: z.string().trim().min(1),
  refreshToken: z.string().trim().min(1).optional(),
});
