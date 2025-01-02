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
  method: "delete",
  path: "/{clientId}/{sessionId}",
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
  method: "delete",
  path: "/{clientId}",
  request: {},
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
