import type { z } from "@hono/zod-openapi";
import type { ArchivedSessionSchema } from "./schemas";

export type ArchivedSession = z.infer<typeof ArchivedSessionSchema>;

export type ArchivedSessions = Array<ArchivedSession>;
