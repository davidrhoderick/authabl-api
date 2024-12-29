import { z } from "@hono/zod-openapi";
import {
  ClientIdParamSchema,
  User,
  zodPassword,
  zodUsername,
} from "../common/schemas";

export const EmailRegistration = z.object({
  email: z.string().email(),
  password: zodPassword,
  verifyEmail: z.boolean().optional(),
});

export const UsernameRegistration = z.object({
  username: zodUsername,
  password: zodPassword,
});

export const RegistrationBodySchema = z
  .union([EmailRegistration, UsernameRegistration])
  .openapi("RegistrationRequest");

export const RegistrationResponse = User.extend({
  code: z.string().regex(/\d{6}/).optional(),
}).openapi("RegistrationResponse");

export const UsersListResponseSchema = z.array(User).openapi("Users");

export const DeleteUserParams = ClientIdParamSchema.extend({
  userId: z.string().trim().min(1),
});
