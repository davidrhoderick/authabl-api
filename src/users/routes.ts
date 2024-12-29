import { createRoute } from "@hono/zod-openapi";
import {
  BadRequestSchema,
  InternalServerErrorSchema,
  UnauthorizedSchema,
  ClientIdParamSchema,
  ClientIdUserIdParamSchema
} from "../common/schemas";
import {
  RegistrationBodySchema,
  RegistrationResponse,
  UsersListResponseSchema,
} from "./schemas";

const tags = ["OAuth"];

export const registrationRoute = createRoute({
  tags,
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

// export const forgottenPasswordRoute = createRoute({
//   tags,
//   method: "post",
//   path: "/{clientId}/forgotten-password",
//   request: {
//     body: {
//       content: {
//         "application/json": {
//           schema: EmailVerificationBodySchema,
//         },
//       },
//     },
//   },
//   responses: {
//     200: {
//       description: "Email sent",
//     },
//     400: {
//       content: {
//         "application/json": {
//           schema: BadRequestSchema,
//         },
//       },
//       description: "Bad Request",
//     },
//     401: {
//       content: {
//         "application/json": {
//           schema: UnauthorizedSchema,
//         },
//       },
//       description: "Unauthorized",
//     },
//     500: {
//       content: {
//         "application/json": {
//           schema: InternalServerErrorSchema,
//         },
//       },
//       description: "Internal server error",
//     },
//   },
// });
