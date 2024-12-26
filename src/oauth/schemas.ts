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

export const ClientIdSchema = z.object({
  clientId: zodRequiredString(),
});

export const ApiKeyHeaderSchema = z.object({
  "X-OAUTHABL-API-KEY": zodRequiredString(),
});

export const TokenBodySchema = z
  .object({
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
  email: z.string().email(),
  password: zodPassword,
});

export const EmailVerificationBodySchema = z.object({
  verificationCode: zodRequiredString(),
  email: z.object({
    to: z.string().email(),
    from: z.string().email(),
    content: zodRequiredString(),
  }),
});

export const ResendVerificationEmailBodySchema = z.object({
  email: z.string().email(),
});

export const ForgottenPasswordBodySchema = z.object({
  email: z.object({
    to: z.string().email(),
    from: z.string().email(),
    content: zodRequiredString(),
  }),
});

export const ResetPasswordBodySchema = z.object({
  password: zodPassword,
  email: z.object({
    to: z.string().email(),
    from: z.string().email(),
    content: zodRequiredString(),
  }),
});

export const UserDeletionParamsSchema = z.object({
  email: zodRequiredString(),
});
