import { z } from "@hono/zod-openapi";

export const EmailVerificationBodySchema = z.object({
	code: z.string().regex(/\d{6}/).optional(),
	email: z.string().email().regex(/[^:]*/),
});

export const ResendVerificationEmailBodySchema = z.object({
	email: z.string().email().regex(/[^:]*/),
});
