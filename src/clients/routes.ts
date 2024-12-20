import { createRoute } from "@hono/zod-openapi";
import {
  ClientParamsSchema,
  ClientSchema,
  ClientsSchema,
  CreateClientBodySchema,
  UpdateClientBodySchema,
} from "./schemas";
import { InternalServerErrorSchema, NotFoundSchema } from "../schemas";

export const getClientRoute = createRoute({
  tags: ["Clients"],
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
  tags: ["Clients"],
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
          schema: InternalServerErrorSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

export const createClientRoute = createRoute({
  tags: ["Clients"],
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
          schema: InternalServerErrorSchema,
        },
      },
      description: "Internal server error",
    },
  },
});

export const updateClientRoute = createRoute({
  tags: ["Clients"],
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
  tags: ["Clients"],
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
          schema: InternalServerErrorSchema,
        },
      },
      description: "Internal server error",
    },
  },
});
