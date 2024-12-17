import { createRoute } from "@hono/zod-openapi";
import {
  ClientParamsSchema,
  ClientSchema,
  ClientsSchema,
  CreateClientBodySchema,
  ErrorSchema,
  UpdateClientBodySchema,
} from "./schemas";

export const getClientRoute = createRoute({
  method: "get",
  path: "/clients/{clientId}",
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
          schema: ErrorSchema,
        },
      },
      description: "Not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

export const listClientRoute = createRoute({
  method: "get",
  path: "/clients",
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
          schema: ErrorSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

export const createClientRoute = createRoute({
  method: "post",
  path: "/clients",
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
          schema: ErrorSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

export const updateClientRoute = createRoute({
  method: "patch",
  path: "/clients/{clientId}",
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
          schema: ErrorSchema,
        },
      },
      description: "Not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

export const deleteClientRoute = createRoute({
  method: "delete",
  path: "/clients/{clientId}",
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
          schema: ErrorSchema,
        },
      },
      description: "Internal server error",
    },
  },
});
