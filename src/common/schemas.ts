import { z } from "@hono/zod-openapi";

export const zodRequiredString = (message = "Required") =>
  z.string({ required_error: message }).trim().min(1, { message });

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
