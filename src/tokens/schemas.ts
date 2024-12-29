import { z } from "@hono/zod-openapi";
import { zodPassword, zodUsername } from "../common/schemas";

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
