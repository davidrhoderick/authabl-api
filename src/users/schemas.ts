import { z } from "@hono/zod-openapi";
import { User, zodPassword, zodUsername } from "../common/schemas";

export const RegistrationBodySchema = z
	.object({
		email: z.string().email().regex(/[^:]*/).optional(),
		username: zodUsername.optional(),
		password: zodPassword,
		verifyEmail: z.boolean().optional(),
	})
	.openapi("RegistrationRequest");

export const RegistrationOrUpdateResponse = User.extend({
	code: z.string().regex(/\d{6}/).optional(),
}).openapi("RegistrationResponse");

export const UpdateBodySchema = z
	.object({
		emails: z.array(z.string().email().regex(/[^:]*/)).optional(),
		username: zodUsername.optional(),
		password: zodPassword.optional(),
		verifyEmail: z.boolean().optional(),
	})
	.openapi("UpdateUserRequest");

export const UsersListResponseSchema = z.array(User).openapi("Users");
