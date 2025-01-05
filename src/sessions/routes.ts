import { createRoute } from "@hono/zod-openapi";
import {
	ClientIdUserIdParamSchema,
	InternalServerErrorSchema,
	NotFoundSchema,
	UnauthorizedSchema,
} from "../common/schemas";
import {
	ArchivedSessionsSchema,
	ClearSessionParamsSchema,
	GetSessionParamsSchema,
	GetSessionResponseSchema,
	RefreshTokenQuery,
	SessionsSchema,
} from "./schemas";

const tags = ["OAuth"];

export const listSessionsRoute = createRoute({
	tags,
	description:
		"Lists all sessions for a user.  Detects the current session via either a Bearer token, if used from a mobile device, or the `oauthabl_accesstoken` cookie, if used from a web client.",
	method: "get",
	path: "/{clientId}/{userId}",
	request: {
		params: ClientIdUserIdParamSchema,
	},
	security: [
		{
			Client: [],
		},
	],
	responses: {
		200: {
			description: "List all sessions",
			content: {
				"application/json": {
					schema: SessionsSchema,
				},
			},
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

export const listArchivedSessionsRoute = createRoute({
	tags,
	description: "Lists all archived sessions for a user.",
	method: "get",
	path: "/{clientId}/{userId}/archive",
	request: {
		params: ClientIdUserIdParamSchema,
	},
	security: [
		{
			Client: [],
		},
	],
	responses: {
		200: {
			description: "List all archived sessions",
			content: {
				"application/json": {
					schema: ArchivedSessionsSchema,
				},
			},
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

export const getSessionRoute = createRoute({
	tags,
	description: "Retrieve a session's details by its user and session IDs.",
	method: "get",
	path: "/{clientId}/{userId}/{sessionId}",
	request: {
		params: GetSessionParamsSchema,
		query: RefreshTokenQuery,
	},
	security: [
		{
			Client: [],
		},
	],
	responses: {
		200: {
			description: "Get a specific session and all it's tokens",
			content: {
				"application/json": {
					schema: GetSessionResponseSchema,
				},
			},
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
			description: "Not found",
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

export const clearSessionRoute = createRoute({
	tags,
	description: "Archive a singular session.",
	method: "delete",
	path: "/{clientId}/{userId}/{sessionId}",
	request: {
		params: ClearSessionParamsSchema,
	},
	security: [
		{
			Client: [],
		},
	],
	responses: {
		200: {
			description: "Clear a specific session",
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
			description: "Not found",
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

export const clearSessionsRoute = createRoute({
	tags,
	description: "Archive all sessions for a user.",
	method: "delete",
	path: "/{clientId}/{userId}",
	request: {
		params: ClientIdUserIdParamSchema,
	},
	security: [
		{
			Client: [],
		},
	],
	responses: {
		200: {
			description: "Clear all logged in sessions",
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
