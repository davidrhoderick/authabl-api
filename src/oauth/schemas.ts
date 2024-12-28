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

export const ClientIdParamSchema = z.object({
  clientId: zodRequiredString(),
});

export const EmailRegistration = z.object({
  email: z.string().email(),
  password: zodPassword,
  verifyEmail: z.boolean().optional(),
});

export const UsernameRegistration = z.object({
  username: zodRequiredString({ length: 5 }),
  password: zodPassword,
});

export const RegistrationBodySchema = z
  .union([EmailRegistration, UsernameRegistration])
  .openapi("RegistrationRequest");

export const User = z
  .object({
    id: zodRequiredString(),
    emailAddresses: z.array(z.string().email()).optional(),
    usernames: z.array(zodRequiredString({ length: 5 })).optional(),
    emailVerified: z.boolean(),
  })
  .openapi("User");

export const RegistrationResponse = User.extend({
  code: z.string().regex(/\d{6}/).optional(),
}).openapi("RegistrationResponse");

export const EmailToken = z.object({
  email: z.string().email(),
  password: zodPassword,
  verifyEmail: z.boolean().optional(),
});

export const UsernameToken = z.object({
  username: zodRequiredString({ length: 5 }),
  password: zodPassword,
});

export const TokenBodySchema = z
  .union([EmailRegistration, UsernameRegistration])
  .openapi("TokenRequest");

export const UsersListResponseSchema = z.array(User).openapi("Users");

export const DeleteUserParams = ClientIdParamSchema.extend({
  userId: zodRequiredString(),
});

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

export const EmailVerificationBodySchema = z.object({
  code: z.string().regex(/\d{6}/).optional(),
  email: z.string().email(),
});

export const ResendVerificationEmailBodySchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordBodySchema = z.object({
  password: zodPassword,
});

export const UserDeletionParamsSchema = z.object({
  email: zodRequiredString(),
});
