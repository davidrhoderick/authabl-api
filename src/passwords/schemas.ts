import { z } from "@hono/zod-openapi";
import { zodPassword } from "../common/schemas";

const code = z.string().regex(/\d{6}/).optional();
const email = z.string().email().regex(/[^:]*/);

export const ForgottenPasswordBodySchema = z.object({
	code,
	email,
});

export const ResetPasswordBodySchema = z.object({
	email,
	code,
	password: zodPassword,
});
