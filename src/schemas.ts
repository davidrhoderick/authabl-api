import { z } from "@hono/zod-openapi";

const zodRequiredString = (message = "Required") =>
  z.string({ required_error: message }).trim().min(1, { message });

export const ErrorSchema = z.object({
  code: z.number().openapi({
    example: 400,
  }),
  message: z.string().openapi({
    example: "Bad Request",
  }),
});

export const ClientSchema = z.object({
  id: zodRequiredString(),
  secret: zodRequiredString(),
  name: zodRequiredString(),
  redirectUris: z.array(zodRequiredString().url()).nonempty(),
  accessTokenValidity: z.number().min(60).default(3600),
  refreshTokenValidity: z.number().min(60).default(1209600),
  disableRefreshToken: z.boolean().default(false),
  refreshRefreshToken: z.boolean().default(true),
});

export const CreateClientBodySchema = ClientSchema.omit({
  id: true,
  secret: true,
});

export const UpdateClientBodySchema = CreateClientBodySchema.partial();

export const ClientParamsSchema = z.object({
  clientId: zodRequiredString(),
});

export const ClientsSchema = z.array(z.object({
  id: zodRequiredString(),
  name: zodRequiredString()
}))
