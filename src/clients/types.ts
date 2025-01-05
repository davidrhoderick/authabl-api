import type { z } from "@hono/zod-openapi";
import type { ClientSchema } from "./schemas";

export type Client = z.infer<typeof ClientSchema>;

export type ClientValue = Omit<Client, "name" | "secret">;

export type ClientMetadata = Pick<Client, "name" | "secret">;
