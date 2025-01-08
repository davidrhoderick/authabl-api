import {
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
  SESSION_PREFIX,
} from "../../common/constants";
import type { Bindings } from "../../common/types";
import type { ArchivedSession } from "../../sessions/types";
import type {
  SessionAccessTokenMetadata,
  SessionMetadata,
  SessionRefreshTokenMetadata,
  SessionValue,
  TokenPayload,
} from "../types";

export type ArchiveSessionInput = {
  env: Bindings;
  clientId: string;
  userId: string;
  sessionId: string;
  accessTokenKey?: string;
  accessTokenIndexKey?: string;
  refreshTokenKey?: string;
  refreshTokenIndexKey?: string;
};

export const archiveSession = async ({
  env,
  clientId,
  userId,
  sessionId,
  accessTokenKey,
  accessTokenIndexKey,
  refreshTokenKey,
  refreshTokenIndexKey,
}: ArchiveSessionInput) => {
  // Create an array of KV delete promises
  const deletions: Array<Promise<void>> = [];

  // Set up the R2 session key and data
  let r2SessionKey = "";
  const r2SessionData: Partial<ArchivedSession> = { deletedAt: Date.now() };

  // Set up the R2 session key
  r2SessionKey = `${clientId}/${userId}/${sessionId}`;

  r2SessionData.id = sessionId;

  const session = await env.KV.getWithMetadata<SessionValue, SessionMetadata>(
    `${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`,
    "json",
  );

  r2SessionData.createdAt = session.metadata?.createdAt;

  const sessionAccessTokens = await env.KV.list<SessionAccessTokenMetadata>({
    prefix: `${SESSIONACCESSTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}`,
  });

  const accessTokenKeys = sessionAccessTokens.keys
    .map(({ metadata }) => metadata?.accessTokenKey)
    .filter((key) => typeof key !== "undefined");

  const accessTokens: Array<TokenPayload> = [];

  for (const key of accessTokenKeys) {
    const accessToken = await env.KV.get<TokenPayload>(key, "json");

    if (accessToken) accessTokens.push(accessToken);
  }

  r2SessionData.accessTokens = accessTokens;

  if (accessTokenKey) deletions.push(env.KV.delete(accessTokenKey));

  if (accessTokenIndexKey) deletions.push(env.KV.delete(accessTokenIndexKey));

  deletions.push(
    env.KV.delete(`${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`),
    ...accessTokenKeys.map((key) => env.KV.delete(key)),
  );

  if (!r2SessionKey.length) r2SessionKey = `${clientId}/${userId}/${sessionId}`;

  const sessionRefreshTokens = await env.KV.list<SessionRefreshTokenMetadata>({
    prefix: `${SESSIONREFRESHTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}`,
  });

  const refreshTokenKeys = sessionRefreshTokens.keys
    .map(({ metadata }) => metadata?.refreshTokenKey)
    .filter((key) => typeof key !== "undefined");

  const refreshTokens: Array<TokenPayload> = [];

  for (const key of refreshTokenKeys) {
    const refreshToken = await env.KV.get<TokenPayload>(key, "json");

    if (refreshToken) refreshTokens.push(refreshToken);
  }

  r2SessionData.refreshTokens = refreshTokens;

  if (refreshTokenKey) deletions.push(env.KV.delete(refreshTokenKey));

  if (refreshTokenIndexKey) deletions.push(env.KV.delete(refreshTokenIndexKey));

  deletions.push(...refreshTokenKeys.map((key) => env.KV.delete(key)));

  await env.R2.put(r2SessionKey, JSON.stringify(r2SessionData));

  await Promise.all(deletions);
};
