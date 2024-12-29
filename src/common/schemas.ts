import { z } from "@hono/zod-openapi";

export const zodUsername = z.string().regex(/[a-zA-Z0-9_]{5,32}/);

export const zodPassword = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[\W_]/, "Password must contain at least one special character")
  .regex(/^\S*$/, "Password must not contain spaces");

export const BadRequestSchema = z
  .object({
    code: z.number().openapi({
      example: 400,
    }),
    message: z.string().openapi({
      example: "Bad Request",
    }),
  })
  .openapi("Error");

export const UnauthorizedSchema = z
  .object({
    code: z.number().openapi({
      example: 401,
    }),
    message: z.string().openapi({
      example: "Unauthorized",
    }),
  })
  .openapi("Error");

export const NotFoundSchema = z
  .object({
    code: z.number().openapi({
      example: 404,
    }),
    message: z.string().openapi({
      example: "Not Found",
    }),
  })
  .openapi("Error");

export const InternalServerErrorSchema = z
  .object({
    code: z.number().openapi({
      example: 500,
    }),
    message: z.string().openapi({
      example: "Internal Service Error",
    }),
  })
  .openapi("Error");

export const ClientIdParamSchema = z.object({
  clientId: z.string().trim().min(1),
});

export const User = z
  .object({
    id: z.string().trim().min(1),
    emailAddresses: z.array(z.string().email()).optional(),
    usernames: z.array(zodUsername).optional(),
    emailVerified: z.boolean(),
  })
  .openapi("User");
