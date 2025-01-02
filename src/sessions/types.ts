import { z } from "@hono/zod-openapi";
import { ArchivedSessionSchema } from "./schemas";

export type ArchivedSession = z.infer<typeof ArchivedSessionSchema>;

export type ArchivedSessions = Array<ArchivedSession>;
