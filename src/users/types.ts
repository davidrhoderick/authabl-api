import { z } from "@hono/zod-openapi";
import { User } from "../common/schemas";

export type User = z.infer<typeof User>;

export type UserValue = Pick<z.infer<typeof User>, "emailVerified"> & {
  password: string;
};

export type UserMetadata = Omit<User, "id">;