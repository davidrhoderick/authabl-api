import type { z } from "@hono/zod-openapi";
import type { User as UserSchema } from "../common/schemas";

export type User = z.infer<typeof UserSchema>;

export type UserValue = Pick<z.infer<typeof UserSchema>, "emailVerified"> & {
	password: string;
};

export type UserMetadata = Omit<User, "id">;
