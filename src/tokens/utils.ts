import { decode, sign } from "hono/jwt";
import { Bindings } from "../common/types";
import { getClient } from "../common/utils";
import {
  ACCESSTOKEN_COOKIE,
  ACCESSTOKEN_PREFIX,
  ACCESSTOKENINDEX_PREFIX,
  REFRESHTOKEN_COOKIE,
  REFRESHTOKEN_PREFIX,
  REFRESHTOKENINDEX_PREFIX,
  SESSION_PREFIX,
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
} from "../common/constants";
import hyperid from "hyperid";
import { Context } from "hono";
import { getCookie } from "hono/cookie";
import {
  AccessTokenResult,
  RefreshTokenResult,
  SessionAccessTokenMetadata,
  SessionMetadata,
  SessionRefreshTokenMetadata,
  SessionValue,
  TokenPayload,
} from "./types";

type CreateSessionResult = {
  accessToken: string;
  accessTokenValidity: number;
  disableRefreshToken?: boolean;
  refreshToken?: string;
  refreshTokenValidity?: number;
};

export const createSession = async ({
  clientId,
  userId,
  env,
}: {
  clientId: string;
  userId: string;
  env: Bindings;
}): Promise<CreateSessionResult | false> => {
  // Get the current time once
  const iat = Date.now();

  // Start a new hyperid instance
  const sessionIdInstance = hyperid({ urlSafe: true });
  const tokenIdInstance = hyperid();

  // Get the client settings
  const client = await getClient({ kv: env.KV, clientId });
  if (!client) return false;
  const { accessTokenValidity, disableRefreshToken, refreshTokenValidity } =
    client;

  // Create the session ID
  const sessionId = sessionIdInstance();

  // Create the access token data
  const accessTokenData: TokenPayload = {
    sub: userId,
    iss: "oauthabl",
    aud: clientId,
    iat,
    type: "access",
    exp: iat + accessTokenValidity * 1000,
    sid: sessionId,
  };
  const accessTokenString = JSON.stringify(accessTokenData);
  const accessToken = await sign(accessTokenData, env.ACCESSTOKEN_SECRET);

  // Create the access token with an index
  const accessTokenIndexKey = `${ACCESSTOKENINDEX_PREFIX}:${accessToken}`;
  const accessTokenKeyId = tokenIdInstance();
  const accessTokenKey = `${ACCESSTOKEN_PREFIX}:${clientId}:${userId}:${accessTokenKeyId}`;
  await env.KV.put(accessTokenIndexKey, accessTokenKey, {
    expirationTtl: accessTokenValidity,
  });
  await env.KV.put(accessTokenKey, accessTokenString, {
    expirationTtl: accessTokenValidity,
    metadata: { accessTokenValidity },
  });

  // Create an access token -> session link
  const sessionAccessTokenKey = `${SESSIONACCESSTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:${accessTokenKeyId}`;
  await env.KV.put(sessionAccessTokenKey, "", {
    metadata: { accessTokenIndexKey, accessTokenKey },
  });

  // Set the result
  const result: CreateSessionResult = {
    accessToken,
    accessTokenValidity,
    disableRefreshToken,
  };
  const sessionData: SessionValue = { accessTokenIndexKey };

  if (!disableRefreshToken) {
    // Create the refresh token data
    const refreshTokenData: TokenPayload = {
      sub: userId,
      iss: "oauthabl",
      aud: clientId,
      iat,
      type: "refresh",
      exp: iat + refreshTokenValidity * 1000,
      sid: sessionId,
    };
    const refreshTokenString = JSON.stringify(refreshTokenData);
    const refreshToken = await sign(refreshTokenData, env.REFRESHTOKEN_SECRET);

    // Create the refresh token with an index
    const refreshTokenIndexKey = `${REFRESHTOKENINDEX_PREFIX}:${refreshToken}`;
    const refreshTokenKeyId = tokenIdInstance();
    const refreshTokenKey = `${REFRESHTOKEN_PREFIX}:${clientId}:${userId}:${refreshTokenKeyId}`;
    await env.KV.put(refreshTokenIndexKey, refreshTokenKey, {
      expirationTtl: refreshTokenValidity,
    });
    await env.KV.put(refreshTokenKey, refreshTokenString, {
      expirationTtl: refreshTokenValidity,
      metadata: { refreshTokenValidity },
    });

    // Create an refresh token -> session link
    const sessionRefreshTokenKey = `${SESSIONREFRESHTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:${refreshTokenKeyId}`;
    await env.KV.put(sessionRefreshTokenKey, "", {
      metadata: { refreshTokenIndexKey, refreshTokenKey },
    });

    // Update the result
    result.refreshToken = refreshToken;
    result.refreshTokenValidity = refreshTokenValidity;
    sessionData.refreshTokenIndexKey = refreshTokenIndexKey;
  }

  // Save the sassion with the data
  const sessionKey = `${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`;
  await env.KV.put(sessionKey, JSON.stringify(sessionData), {
    metadata: { createdAt: iat },
  });

  return result;
};

export const detectAccessToken = async (
  c: Context<{ Bindings: Bindings }>,
  returnToken?: boolean
): Promise<false | AccessTokenResult> => {
  const now = Date.now();

  const accessTokenCookie = getCookie(c, ACCESSTOKEN_COOKIE);

  const accessTokenHeader = c.req.header("Authorization");

  if (!accessTokenCookie?.length && !accessTokenHeader?.startsWith("Bearer "))
    return false;

  const accessToken = accessTokenCookie?.length
    ? accessTokenCookie
    : accessTokenHeader!.split(" ")[1];

  const decodedAccessToken = decode(accessToken);

  if (!decodedAccessToken) return false;

  const accessTokenIndexKey = `${ACCESSTOKENINDEX_PREFIX}:${accessToken}`;

  const accessTokenKey = await c.env.KV.get(accessTokenIndexKey);

  if (!accessTokenKey) return false;

  const accessTokenItem = await c.env.KV.get<TokenPayload>(
    accessTokenKey,
    "json"
  );

  if (!accessTokenItem) return false;

  const { payload } = decodedAccessToken as unknown as {
    payload: TokenPayload;
  };

  if (
    payload.iss === "oauthabl" &&
    payload.iss === accessTokenItem.iss &&
    payload.sub === accessTokenItem.sub &&
    payload.exp === accessTokenItem.exp &&
    now < payload.exp &&
    now > payload.iat
  ) {
    const result: AccessTokenResult = {
      userId: payload.sub,
      clientId: payload.aud,
      expiresAt: payload.exp,
      createdAt: payload.iat,
      sessionId: payload.sid,
    };

    if (returnToken)
      return {
        ...result,
        accessTokenIndexKey,
        accessTokenKey,
      };
    return result;
  }

  return false;
};

export const detectRefreshToken = async (
  c: Context<{ Bindings: Bindings }>,
  refreshTokenBody?: string,
  returnToken?: boolean
): Promise<false | RefreshTokenResult> => {
  const now = Date.now();

  const refreshTokenCookie = getCookie(c, REFRESHTOKEN_COOKIE);

  if (!refreshTokenCookie?.length && !refreshTokenBody?.length) return false;

  const refreshToken = refreshTokenCookie?.length
    ? refreshTokenCookie
    : refreshTokenBody;

  const decodedRefreshToken = decode(refreshToken!);

  if (!decodedRefreshToken) return false;

  const refreshTokenIndexKey = `${REFRESHTOKENINDEX_PREFIX}:${refreshTokenCookie}`;

  const refreshTokenKey = await c.env.KV.get(refreshTokenIndexKey);

  if (!refreshTokenKey) return false;

  const refreshTokenItem = await c.env.KV.get<TokenPayload>(
    refreshTokenKey,
    "json"
  );

  if (!refreshTokenItem) return false;

  const { payload } = decodedRefreshToken as unknown as {
    payload: TokenPayload;
  };

  if (
    payload.iss === "oauthabl" &&
    payload.aud === refreshTokenItem.aud &&
    payload.sub === refreshTokenItem.sub &&
    payload.exp === refreshTokenItem.exp &&
    now < payload.exp &&
    now > payload.iat
  ) {
    const result: AccessTokenResult = {
      userId: payload.sub,
      clientId: payload.aud,
      expiresAt: payload.exp,
      createdAt: payload.iat,
      sessionId: payload.sid,
    };

    if (returnToken)
      return {
        ...result,
        refreshTokenIndexKey,
        refreshTokenKey,
      };
    return result;
  }

  return false;
};

export const deleteSession = async (
  c: Context<{ Bindings: Bindings }>,
  refreshToken?: string
) => {
  // Get the current access token
  const accessTokenResult = await detectAccessToken(c, true);

  // Create an array of KV delete promises
  const deletions: Array<Promise<void>> = [];

  // Set up the R2 session key and data
  let r2SessionKey: string = "";
  const r2SessionData: {
    id?: string;
    createdAt?: number;
    deletedAt: number;
    accessTokens?: Array<TokenPayload>;
    refreshTokens?: Array<TokenPayload>;
  } = { deletedAt: Date.now() };

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
