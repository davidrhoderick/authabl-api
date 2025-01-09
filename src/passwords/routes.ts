import { createRoute } from "@hono/zod-openapi";
import {
  BadRequestSchema,
  InternalServerErrorSchema,
  NotFoundSchema,
  UnauthorizedSchema,
  UnprocessableEntitySchema,
} from "../common/schemas";
import { MobileTokenResponseSchema } from "../tokens/schemas";
import {
  ForgotPasswordBodySchema,
  ForgotPasswordResponseSchema,
  ResetPasswordBodySchema,
} from "./schemas";

const tags = ["OAuth"];

export const forgotPasswordRoute = createRoute({
  tags,
  description:
    "Initiate the forgotten password flow by returning a generated code associated with an email address and user.",
  method: "post",
  path: "/{clientId}/forgot",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ForgotPasswordBodySchema,
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
      description: "Code sent",
      content: {
        "application/json": {
          schema: ForgotPasswordResponseSchema,
        },
      },
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

export const webResetPasswordRoute = createRoute({
  tags,
  description:
    "Reset the password for a user using a generated code on a web client, which means we create the session as cookies that are returned.",
  method: "post",
  path: "/{clientId}/reset/web",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ResetPasswordBodySchema,
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
      description: "Password reset",
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

export const mobileResetPasswordRoute = createRoute({
  tags,
  description:
    "Reset the password for a user using a generated code on a web client, which means we create the session and return tokens in the response body.",
  method: "post",
  path: "/{clientId}/reset/mobile",
  security: [
    {
      Client: [],
    },
  ],
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
      description: "Password reset",
      content: {
        "application/json": {
          schema: MobileTokenResponseSchema,
        },
      },
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
