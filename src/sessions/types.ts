import type { z } from "@hono/zod-openapi";
import type { ArchivedSessionSchema, SessionsSchema } from "./schemas";

export type Sessions = z.infer<typeof SessionsSchema>;

export type ArchivedSession = z.infer<typeof ArchivedSessionSchema>;

export type ArchivedSessions = Array<ArchivedSession>;
