import { SESSION_PREFIX } from "../common/constants";
import type { Bindings } from "../common/types";
import type { SessionMetadata } from "../tokens/types";
import { archiveSession } from "../tokens/utils";

export const clearUsersSessions = async ({
  clientId,
  userId,
  env,
}: { clientId: string; userId: string; env: Bindings }) => {
  const prefix = `${SESSION_PREFIX}:${clientId}:${userId}:`;

  const sessions = await env.KV.list<SessionMetadata>({
    prefix,
  });

  for (const session of sessions.keys) {
    await archiveSession({
      env,
      clientId,
      userId,
      sessionId: session.name.substring(prefix.length),
    });
  }
};
