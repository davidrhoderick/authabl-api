import { createRoute } from "@hono/zod-openapi";
import {
  BadRequestSchema,
  InternalServerErrorSchema,
  NotFoundSchema,
  UnauthorizedSchema,
} from "../common/schemas";
import {
  ClearSessionParamsSchema,
  EmailVerificationSchema,
  RegistrationBodySchema,
  SessionsSchema,
  TokenBodySchema,
} from "./schemas";

const tags = ["OAuth"];

export const tokenRoute = createRoute({
  tags,
  method: "post",
  path: "/oauth/token",
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

export const refreshRoute = createRoute({
  tags,
  method: "post",
  path: "/oauth/refresh",
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

export const logoutRoute = createRoute({
  tags,
  method: "post",
  path: "/oauth/logout",
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

export const validationRoute = createRoute({
  tags,
  method: "get",
  path: "/oauth/validate",
  responses: {
    200: {
      description: "Confirm that the access token is valid",
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

export const clearSessionsRoute = createRoute({
  tags,
  method: "delete",
  path: "/oauth/sessions",
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

export const clearSessionRoute = createRoute({
  tags,
  method: "delete",
  path: "/oauth/sessions/{sessionId}",
  request: {
    params: ClearSessionParamsSchema,
  },
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

export const listSessionsRoute = createRoute({
  tags,
  method: "get",
  path: "/oauth/sessions",
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

export const registrationRoute = createRoute({
  tags,
  method: "post",
  path: "/register",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegistrationBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User created",
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

export const emailVerificationRoute = createRoute({
  tags,
  method: "post",
  path: "/verify/email",
  request: {
    body: {
      content: {
        "application/json": {
          schema: EmailVerificationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User created",
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
