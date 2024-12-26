import { z } from "@hono/zod-openapi";
import {
  RegistrationTokenBodySchema,
  RegistrationTokenResponseSchema,
} from "./schemas";

export type User = z.infer<typeof RegistrationTokenResponseSchema>;

export type UserValue = Pick<
  z.infer<typeof RegistrationTokenBodySchema>,
  "password"
>;

export type UserMetadata = Pick<User, "usernames" | "emailAddresses">;
