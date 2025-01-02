import { Bindings } from "../../common/types";
import {
  SESSION_PREFIX,
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
} from "../../common/constants";
import { Context } from "hono";
import {
  SessionAccessTokenMetadata,
  SessionMetadata,
  SessionRefreshTokenMetadata,
  SessionValue,
  TokenPayload,
} from "../types";
import { ArchivedSession } from "../../sessions/types";
import { detectAccessToken } from "./detect-access-token";
import { detectRefreshToken } from "./detect-refresh-token";

export const archiveSession = async (
  c: Context<{ Bindings: Bindings }>,
  refreshToken?: string
) => {
  // Get the current access token
  const accessTokenResult = await detectAccessToken(c, true);

  // Create an array of KV delete promises
  const deletions: Array<Promise<void>> = [];

  // Set up the R2 session key and data
  let r2SessionKey: string = "";
  const r2SessionData: Partial<ArchivedSession> = { deletedAt: Date.now() };

  // If we have an access token
  if (accessTokenResult) {
    // Set up the R2 session key
    r2SessionKey = `${accessTokenResult.clientId}/${accessTokenResult.userId}/${accessTokenResult.sessionId}`;

    r2SessionData.id = accessTokenResult.sessionId;

    const session = await c.env.KV.getWithMetadata<
      SessionValue,
      SessionMetadata
    >(
      `${SESSION_PREFIX}:${accessTokenResult.clientId}:${accessTokenResult.userId}:${accessTokenResult.sessionId}`,
      "json"
    );

    r2SessionData.createdAt = session.metadata?.createdAt;

    const sessionAccessTokens = await c.env.KV.list<SessionAccessTokenMetadata>(
      {
        prefix: `${SESSIONACCESSTOKEN_PREFIX}:${accessTokenResult.clientId}:${accessTokenResult.userId}:${accessTokenResult.sessionId}`,
      }
    );

    const accessTokenKeys = sessionAccessTokens.keys
      .map(({ metadata }) => metadata?.accessTokenKey)
      .filter((key) => typeof key !== "undefined");

    const accessTokens: Array<TokenPayload> = [];

    for (const key of accessTokenKeys) {
      const accessToken = await c.env.KV.get<TokenPayload>(key, "json");

      if (accessToken) accessTokens.push(accessToken);
    }

    r2SessionData.accessTokens = accessTokens;

    deletions.push(
      c.env.KV.delete(accessTokenResult.accessTokenKey!),
      c.env.KV.delete(accessTokenResult.accessTokenIndexKey!),
      c.env.KV.delete(
        `${SESSION_PREFIX}:${accessTokenResult.clientId}:${accessTokenResult.userId}:${accessTokenResult.sessionId}`
      ),
      ...accessTokenKeys.map((key) => c.env.KV.delete(key))
    );
  }

  const refreshTokenResult = await detectRefreshToken(c, refreshToken, true);

  if (refreshTokenResult) {
    if (!r2SessionKey.length)
      r2SessionKey = `${refreshTokenResult.clientId}/${refreshTokenResult.userId}/${refreshTokenResult.sessionId}`;

    const sessionRefreshTokens =
      await c.env.KV.list<SessionRefreshTokenMetadata>({
        prefix: `${SESSIONREFRESHTOKEN_PREFIX}:${refreshTokenResult.clientId}:${refreshTokenResult.userId}:${refreshTokenResult.sessionId}`,
      });

    const refreshTokenKeys = sessionRefreshTokens.keys
      .map(({ metadata }) => metadata?.refreshTokenKey)
      .filter((key) => typeof key !== "undefined");

    const refreshTokens: Array<TokenPayload> = [];

    for (const key of refreshTokenKeys) {
      const refreshToken = await c.env.KV.get<TokenPayload>(key, "json");

      if (refreshToken) refreshTokens.push(refreshToken);
    }

    r2SessionData.refreshTokens = refreshTokens;

    deletions.push(
      c.env.KV.delete(refreshTokenResult.refreshTokenKey!),
      c.env.KV.delete(refreshTokenResult.refreshTokenIndexKey!),
      ...refreshTokenKeys.map((key) => c.env.KV.delete(key))
    );
  }

  await c.env.R2.put(r2SessionKey, JSON.stringify(r2SessionData));

  await Promise.all(deletions);
};
