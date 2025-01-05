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

export const RegistrationResponse = User.extend({
	code: z.string().regex(/\d{6}/).optional(),
}).openapi("RegistrationResponse");

export const UsersListResponseSchema = z.array(User).openapi("Users");
