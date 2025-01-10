import { z } from "@hono/zod-openapi";

export const zodUsername = z.string().regex(/\w{5,32}/);

export const zodPassword = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[\W_]/, "Password must contain at least one special character")
  .regex(/^\S*$/, "Password must not contain spaces");

export const BadRequestSchema = z.object({
  code: z.number().openapi({
    example: 400,
  }),
  message: z.string().openapi({
    example: "Bad Request",
  }),
});

export const UnauthorizedSchema = z.object({
  code: z.number().openapi({
    example: 401,
  }),
  message: z.string().openapi({
    example: "Unauthorized",
  }),
});

export const NotFoundSchema = z.object({
  code: z.number().openapi({
    example: 404,
  }),
  message: z.string().openapi({
    example: "Not Found",
  }),
});

export const UnprocessableEntitySchema = z.object({
  code: z.number().openapi({
    example: 422,
  }),
  message: z.string().openapi({
    example: "Unprocessable Entity",
  }),
});

export const InternalServerErrorSchema = z.object({
  code: z.number().openapi({
    example: 500,
  }),
  message: z.string().openapi({
    example: "Internal Service Error",
  }),
});

export const ClientIdParamSchema = z.object({
  clientId: z.string().trim().min(1),
});

export const ClientIdUserIdParamSchema = ClientIdParamSchema.extend({
  userId: z.string().trim().min(1),
});

export const User = z
  .object({
    id: z.string().trim().min(1),
    emailAddresses: z.array(z.string().email().regex(/[^:]*/)).optional(),
    username: zodUsername.optional(),
    emailVerified: z.boolean(),
    sessions: z.number().int().optional(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
    role: z
      .enum(["superadmin", "clientadmin", "user"])
      .or(z.string().regex(/^[A-Za-z]+$/)),
  })
  .openapi("User");
