import { z } from "@hono/zod-openapi";
import {
  ClientIdParamSchema,
  User,
  zodPassword,
  zodRole,
  zodUsername,
} from "../common/schemas";

export const RegistrationBodySchema = z
  .object({
    email: z.string().email().regex(/[^:]*/).optional(),
    username: zodUsername.optional(),
    password: zodPassword,
    verifyEmail: z.boolean().optional(),
    role: zodRole.optional()
  })
  .openapi("RegistrationRequest");

export const RegistrationOrUpdateResponse = User.extend({
  code: z.string().regex(/\d{6}/).optional(),
}).openapi("RegistrationResponse");

export const UpdateBodySchema = z
  .object({
    emailAddresses: z.array(z.string().email().regex(/[^:]*/)).optional(),
    username: zodUsername.optional(),
    password: zodPassword.optional(),
    verifyEmail: z.boolean().optional(),
  })
  .openapi("UpdateUserRequest");

export const UsersListResponseSchema = z.array(User).openapi("Users");

export const GetUserParamSchema = ClientIdParamSchema.extend({
  property: z.enum(["id", "email", "username"]),
  identifier: z.string().trim().min(1).optional(),
});
