import { createRoute } from "@hono/zod-openapi";
import {
  BadRequestSchema,
  InternalServerErrorSchema,
  UnauthorizedSchema,
  ClientIdParamSchema,
  ClientIdUserIdParamSchema,
  User,
  UnprocessableEntitySchema,
} from "../common/schemas";
import {
  RegistrationBodySchema,
  RegistrationResponse,
  UsersListResponseSchema,
} from "./schemas";
import { GetUserParamSchema } from "../tokens/schemas";
import { EmailVerificationBodySchema } from "../emails/schemas";

const tags = ["OAuth"];

export const registrationRoute = createRoute({
  tags,
  description:
    "Registers a new user using email and/or username and a password.  Optionally triggers email verification by sending a `verifyEmail` flag.  Make sure the password is confirmed before setting.",
  method: "post",
  path: "/{clientId}",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegistrationBodySchema,
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
      content: {
        "application/json": {
          schema: RegistrationResponse,
        },
      },
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

export const listUsersRoute = createRoute({
  tags,
  description: "Lists all users for a client.",
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
      content: {
        "application/json": { schema: UsersListResponseSchema },
      },
      description: "List all users for a client",
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

export const deleteUserRoute = createRoute({
  tags,
  description: "Deletes a user and archives all their sessions.",
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
      description: "Deleted user successfully",
    },
    500: {
      description: "Internal Server Error",
    },
  },
});

export const getUserRoute = createRoute({
  tags,
  description: "Gets a single user by either id, username, or email address.",
  method: "get",
  path: "/{clientId}/{userProperty}/{userIdentifier}",
  request: {
    params: GetUserParamSchema,
  },
  security: [
    {
      Client: [],
    },
  ],
  responses: {
    200: {
      description: "Retrieved user successfully",
      content: {
        "application/json": {
          schema: User,
        },
      },
    },
    400: {
      description: "Bad Request",
    },
    404: {
      description: "Not found",
    },
    500: {
      description: "Internal Server Error",
    },
  },
});

export const forgottenPasswordRoute = createRoute({
  tags,
  method: "post",
  path: "/{clientId}/forgotten-password",
  request: {
    body: {
      content: {
        "application/json": {
          // TODO replace this
          schema: EmailVerificationBodySchema,
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
