import { z } from "@hono/zod-openapi";
import { zodRequiredString } from "../common/schemas";

export const ClientSchema = z
  .object({
    id: zodRequiredString(),
    secret: zodRequiredString(),
    name: zodRequiredString(),
    allowedOrigins: z.array(zodRequiredString().url()).nonempty(),
    accessTokenValidity: z.number().min(60).default(3600),
    refreshTokenValidity: z.number().min(60).default(1209600),
    disableRefreshToken: z.boolean().default(false),
    refreshRefreshToken: z.boolean().default(true),
  })
  .openapi("Client");

export const CreateClientBodySchema = ClientSchema.omit({
  id: true,
  secret: true,
}).openapi("NewClient");

export const UpdateClientBodySchema =
  CreateClientBodySchema.partial().openapi("UpdatedClient");

export const ClientParamsSchema = z
  .object({
    clientId: zodRequiredString(),
  })
  .openapi("ClientId");

export const ClientsSchema = z
  .array(
    z.object({
      name: zodRequiredString(),
      id: zodRequiredString(),
      secret: zodRequiredString(),
    })
  )
  .openapi("Clients");
