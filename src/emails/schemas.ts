import { z } from "@hono/zod-openapi";

const email = z.string().email().regex(/[^:]*/);

export const EmailVerificationBodySchema = z.object({
  code: z.string().regex(/\d{6}/).optional(),
  email,
});

export const ResendVerificationEmailBodySchema = z.object({
  email,
});
