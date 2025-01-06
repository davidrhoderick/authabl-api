import type { z } from "@hono/zod-openapi";
import type { ClientSchema, CreateClientBodySchema, UpdateClientBodySchema } from "./schemas";

export type Client = z.infer<typeof ClientSchema>;

export type ClientValue = Omit<Client, "name" | "secret">;

export type ClientMetadata = Pick<Client, "name" | "secret">;

export type NewClient = z.infer<typeof CreateClientBodySchema>

export type UpdateClient = z.infer<typeof UpdateClientBodySchema>