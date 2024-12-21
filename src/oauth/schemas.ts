import { z } from "@hono/zod-openapi";
import { zodRequiredString } from "../common/schemas";

const zodPassword = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[\W_]/, "Password must contain at least one special character")
  .regex(/^\S*$/, "Password must not contain spaces");

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

export const ClearSessionParamsSchema = z.object({
  sessionId: zodRequiredString(),
});

export const RegistrationBodySchema = z.object({
  clientId: zodRequiredString(),
  clientSecret: zodRequiredString(),
  email: z.string().email(),
  password: zodPassword,
});

export const EmailVerificationSchema = z.object({
  verificationCode: zodRequiredString(),
  email: z.string().email(),
});
