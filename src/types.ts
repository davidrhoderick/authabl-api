import { ClientSchema } from "./schemas";
import { z } from "@hono/zod-openapi";

export type Bindings = {
  CLIENTS: KVNamespace;
};

export type Client = z.infer<typeof ClientSchema>

export type ClientValue = Omit<Client, "name">;

export type ClientMetadata = Pick<Client, "name">;
