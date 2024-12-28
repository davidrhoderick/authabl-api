import { z } from "@hono/zod-openapi";
import { EmailRegistration, User, UsernameRegistration } from "./schemas";

export type User = z.infer<typeof User>;

export type UserValue = Pick<z.infer<typeof User>, "emailVerified"> & {
  password: string;
};

export type UserMetadata = Omit<User, "id">;

export type EmailBody = z.infer<typeof EmailRegistration>;

export type UsernameBody = z.infer<typeof UsernameRegistration>;
