import type { z } from "@hono/zod-openapi";
import type {
	ForgotPasswordBodySchema,
	ForgotPasswordResponseSchema,
	ResetPasswordBodySchema,
} from "./schemas";

export type ForgotPasswordBody = z.infer<typeof ForgotPasswordBodySchema>;

export type ForgotPasswordResponse = z.infer<
	typeof ForgotPasswordResponseSchema
>;

export type ResetPasswordBody = z.infer<typeof ResetPasswordBodySchema>;
