import { createRoute } from "@hono/zod-openapi";
import {
	BadRequestSchema,
	ClientIdParamSchema,
	InternalServerErrorSchema,
	NotFoundSchema,
	UnauthorizedSchema,
	UnprocessableEntitySchema,
} from "../common/schemas";
import {
	EmailVerificationBodySchema,
	ResendVerificationEmailBodySchema,
} from "./schemas";

const tags = ["OAuth"];

export const emailVerificationRoute = createRoute({
	tags,
	description: "Verify an email address with a code.",
	method: "post",
	path: "/{clientId}/verify",
	request: {
		params: ClientIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: EmailVerificationBodySchema,
				},
			},
		},
	},
	security: [
		{
			Client: [],
		},
	],
	responses: {
		200: {
			description: "Email verified",
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
		404: {
			content: {
				"application/json": {
					schema: NotFoundSchema,
				},
			},
			description: "Not Found",
		},
		422: {
			content: {
				"application/json": {
					schema: UnprocessableEntitySchema,
				},
			},
			description: "Unprocessable Entity",
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

export const resendVerificationEmailRoute = createRoute({
	tags,
	description: "Re-request an email verification code.",
	method: "post",
	path: "/{clientId}/resend",
	request: {
		params: ClientIdParamSchema,
		body: {
			content: {
				"application/json": {
					schema: ResendVerificationEmailBodySchema,
				},
			},
		},
	},
	security: [
		{
			Client: [],
		},
	],
	responses: {
		200: {
			description: "Code resent",
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
