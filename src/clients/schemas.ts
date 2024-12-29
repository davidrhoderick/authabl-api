import { z } from "@hono/zod-openapi";

export const ClientSchema = z
  .object({
    id: z.string().trim().min(1),
    secret: z.string().trim().min(1),
    name: z.string().trim().min(1),
    allowedOrigins: z.array(z.string().url()).nonempty(),
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
    clientId: z.string().trim().min(1),
  })
  .openapi("ClientId");

export const ClientsSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1),
      id: z.string().trim().min(1),
      secret: z.string().trim().min(1),
    })
  )
  .openapi("Clients");
