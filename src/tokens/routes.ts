import { createRoute } from "@hono/zod-openapi";
import {
  InternalServerErrorSchema,
  UnauthorizedSchema,
  ClientIdParamSchema,
  User,
} from "../common/schemas";
import {
  LogoutBodySchema,
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
  responses: {
    200: {
      description:
        "Returns an access &, if configured, refresh token as JWT cookies",
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
  request: {},
  responses: {
    200: {
      description:
        "Refreshes an access &, if configured, refresh token as JWT cookies",
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

export const webLogoutRoute = createRoute({
  tags,
  method: "delete",
  path: "/{clientId}/web",
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

export const mobileLogoutRoute = createRoute({
  tags,
  method: "delete",
  path: "/{clientId}/mobile",
  request: {
    params: ClientIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: LogoutBodySchema,
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
      description: "Log a user out by clearing refresh & access tokens",
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
