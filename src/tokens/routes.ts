import { createRoute } from "@hono/zod-openapi";
import {
  ClientIdParamSchema,
  InternalServerErrorSchema,
  UnauthorizedSchema,
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
  description:
    "Request an access token and, if configured, a refresh token by the user's username or email address and password.  The web version sets cookies for the access and refresh tokens.",
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
  description:
    "Request an access token and, if configured, a refresh token by the user's username or email address and password.  The mobile version returns the access and refresh tokens in the response body.",
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
  description:
    "Validate the access token and return the current user's ID, role, and additional access token information.  If used with a mobile device, the access token should be sent as a Bearer token.  If used with a web client, it should be sent as a cookie named `oauthabl_accesstoken`.",
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
  description:
    "Refreshes an access token by validating the refresh token and issuing a new access token tied to the current session.  If used with a mobile device, the refresh token should be sent in the request body.  Mobile devices will also receive the new access and refresh tokens in the response body. If used with a web client, the refresh token should be included as a cookie named `oauthabl_refreshtoken`. Web clients will receive new access and refresh tokens as cookies named `oauthabl_accesstoken` and `oauthabl_refreshtoken`.",
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
  description:
    "Logs out a user by archiving its session.  This includes invalidating the current access and refresh token.  If used with a mobile device, the access token is retrieved from the Bearer token header.  If used with a web client, the access token is retrieved from the `oauthabl_accesstoken` cookie.",
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
