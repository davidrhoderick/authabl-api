import { createRoute } from "@hono/zod-openapi";
import {
	BadRequestSchema,
	InternalServerErrorSchema,
	UnauthorizedSchema,
} from "../common/schemas";
import { EmailVerificationBodySchema } from "../emails/schemas";
import { ForgottenPasswordBodySchema, ResetPasswordBodySchema } from "./schemas";

const tags = ["OAuth"];

export const forgotPasswordRoute = createRoute({
	tags,
	method: "post",
	path: "/{clientId}/forgot",
	request: {
		body: {
			content: {
				"application/json": {
					schema: ForgottenPasswordBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Email sent",
		},
		400: {
			content: {
				"application/json": {
					schema: BadRequestSchema,
				},
			},
			description: "Bad Request",
		},
		401: {
			content: {
				"application/json": {
					schema: UnauthorizedSchema,
				},
			},
			description: "Unauthorized",
		},
		500: {
			content: {
				"application/json": {
					schema: InternalServerErrorSchema,
				},
			},
			description: "Internal server error",
		},
	},
});

export const resetPasswordRoute = createRoute({
	tags,
	method: "post",
	path: "/{clientId}/reset",
	request: {
		body: {
			content: {
				"application/json": {
					schema: ResetPasswordBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Email sent",
		},
		400: {
			content: {
				"application/json": {
					schema: BadRequestSchema,
				},
			},
			description: "Bad Request",
		},
		401: {
			content: {
				"application/json": {
					schema: UnauthorizedSchema,
				},
			},
			description: "Unauthorized",
		},
		500: {
			content: {
				"application/json": {
					schema: InternalServerErrorSchema,
				},
			},
			description: "Internal server error",
		},
	},
});
