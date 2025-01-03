import { createRoute } from "@hono/zod-openapi";
import {
  InternalServerErrorSchema,
  UnauthorizedSchema,
  ClientIdParamSchema,
  User,
} from "../common/schemas";
import {
  MobileTokenResponseSchema,
  RefreshBodySchema,
  RefreshTokenResponseSchema,
  TokenBodySchema,
  ValidationResponseSchema,
} from "./schemas";

const tags = ["OAuth"];

export const webTokenRoute = createRoute({
  tags,
  method: "post",
  path: "/{clientId}/web",
  request: {
    body: {
      content: {
        "application/json": {
          schema: TokenBodySchema,
        },
      },
    },
    params: ClientIdParamSchema,
  },
  security: [
    {
      Client: [],
    },
  ],
  responses: {
    200: {
      description:
        "Returns an access &, if configured, refresh token as JWT cookies",
      content: {
        "application/json": {
          schema: User,
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

export const mobileTokenRoute = createRoute({
  tags,
  method: "post",
  path: "/{clientId}/mobile",
  request: {
    body: {
      content: {
        "application/json": {
          schema: TokenBodySchema,
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
      description:
        "Returns an access &, if configured, refresh token as JWT cookies",
      content: {
        "application/json": {
          schema: MobileTokenResponseSchema,
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

export const validationRoute = createRoute({
  tags,
  method: "get",
  path: "/{clientId}",
  request: {
    params: ClientIdParamSchema,
  },
  security: [
    {
      Client: [],
    },
  ],
  responses: {
    200: {
      description: "Confirm that the access token is valid",
      content: {
        "application/json": {
          schema: ValidationResponseSchema,
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

export const refreshRoute = createRoute({
  tags,
  method: "post",
  path: "/{clientId}/refresh",
  request: {
    params: ClientIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: RefreshBodySchema,
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
      description:
        "Refreshes an access &, if configured, refresh token as JWT cookies",
      content: {
        "application/json": {
          schema: RefreshTokenResponseSchema,
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

export const logoutRoute = createRoute({
  tags,
  method: "delete",
  path: "/{clientId}",
  request: {
    params: ClientIdParamSchema,
  },
  security: [
    {
      Client: [],
    },
  ],
  responses: {
    200: {
      description: "Log a user out by clearing JWT cookies",
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
