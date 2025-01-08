import { z } from "@hono/zod-openapi";
import { zodPassword } from "../common/schemas";

const code = z.string().regex(/\d{6}/);
const email = z.string().email().regex(/[^:]*/);

export const ForgotPasswordBodySchema = z.object({
	email,
});

export const ForgotPasswordResponseSchema = z.object({
	code,
});

export const ResetPasswordBodySchema = z.object({
	email,
	code,
	password: zodPassword,
});
