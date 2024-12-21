import { createRoute } from "@hono/zod-openapi";
import {
  ClientParamsSchema,
  ClientSchema,
  ClientsSchema,
  CreateClientBodySchema,
  UpdateClientBodySchema,
} from "./schemas";
import { InternalServerErrorSchema, NotFoundSchema } from "../common/schemas";

const tags = ["Clients"];

export const getClientRoute = createRoute({
  tags,
  method: "get",
  path: "/{clientId}",
  request: {
    params: ClientParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ClientSchema,
        },
      },
      description: "Retrieve the client",
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

export const listClientRoute = createRoute({
  tags,
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ClientsSchema,
        },
      },
      description: "List all clients",
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

export const createClientRoute = createRoute({
  tags,
  method: "post",
  path: "/",
  request: {
    body: {
      content: { "application/json": { schema: CreateClientBodySchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ClientSchema,
        },
      },
      description: "Create a client",
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

export const updateClientRoute = createRoute({
  tags,
  method: "patch",
  path: "/{clientId}",
  request: {
    params: ClientParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateClientBodySchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ClientSchema,
        },
      },
      description: "Update a client",
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

export const deleteClientRoute = createRoute({
  tags,
  method: "delete",
  path: "/{clientId}",
  request: {
    params: ClientParamsSchema,
  },
  responses: {
    200: {
      description: "Delete a client",
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
