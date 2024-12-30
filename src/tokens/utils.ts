import { decode, sign } from "hono/jwt";
import { Bindings } from "../common/types";
import { getClient } from "../common/utils";
import {
  ACCESSTOKEN_COOKIE,
  ACCESSTOKEN_PREFIX,
  ACCESSTOKENINDEX_PREFIX,
  REFRESHTOKEN_PREFIX,
  REFRESHTOKENINDEX_PREFIX,
  SESSION_PREFIX,
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
} from "../common/constants";
import hyperid from "hyperid";
import { Context } from "hono";
import { getCookie } from "hono/cookie";

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
  // Start a new hyperid instance
  const sessionIdInstance = hyperid({ urlSafe: true });
  const tokenIdInstance = hyperid();

  // Get the client settings
  const client = await getClient({ kv: env.OAUTHABL, clientId });
  if (!client) return false;
  const { accessTokenValidity, disableRefreshToken, refreshTokenValidity } =
    client;

  // Create the session ID
  const sessionId = sessionIdInstance();

  // Create the access token data
  const accessTokenData = {
    userId,
    clientId,
    expiresAt: Date.now() + accessTokenValidity * 1000,
    sessionId,
  };
  const accessTokenString = JSON.stringify(accessTokenData);
  const accessToken = await sign(accessTokenData, env.ACCESSTOKEN_SECRET);

  // Create the access token with an index
  const accessTokenIndexKey = `${ACCESSTOKENINDEX_PREFIX}:${accessToken}`;
  const accessTokenKeyId = tokenIdInstance();
  const accessTokenKey = `${ACCESSTOKEN_PREFIX}:${clientId}:${userId}:${accessTokenKeyId}`;
  await env.OAUTHABL.put(accessTokenIndexKey, accessTokenKey, {
    expirationTtl: accessTokenValidity,
  });
  await env.OAUTHABL.put(accessTokenKey, accessTokenString, {
    expirationTtl: accessTokenValidity,
    metadata: { accessTokenValidity },
  });

  // Create an access token -> session link
  const sessionAccessTokenKey = `${SESSIONACCESSTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:${accessTokenKeyId}`;
  await env.OAUTHABL.put(sessionAccessTokenKey, "", {
    metadata: { accessTokenIndexKey, accessTokenKey },
  });

  // Set the result
  const result: CreateSessionResult = {
    accessToken,
    accessTokenValidity,
    disableRefreshToken,
  };
  const sessionData: { accessTokenKeyId: string; refreshTokenKeyId?: string } =
    { accessTokenKeyId };

  if (!disableRefreshToken) {
    // Create the refresh token data
    const refreshTokenData = {
      userId,
      clientId,
      expiresAt: Date.now() + refreshTokenValidity * 1000,
      sessionId,
    };
    const refreshTokenString = JSON.stringify(refreshTokenData);
    const refreshToken = await sign(refreshTokenData, env.REFRESHTOKEN_SECRET);

    // Create the refresh token with an index
    const refreshTokenIndexKey = `${REFRESHTOKENINDEX_PREFIX}:${refreshToken}`;
    const refreshTokenKeyId = tokenIdInstance();
    const refreshTokenKey = `${REFRESHTOKEN_PREFIX}:${clientId}:${userId}:${refreshTokenKeyId}`;
    await env.OAUTHABL.put(refreshTokenIndexKey, refreshTokenKey, {
      expirationTtl: refreshTokenValidity,
    });
    await env.OAUTHABL.put(refreshTokenKey, refreshTokenString, {
      expirationTtl: refreshTokenValidity,
      metadata: { refreshTokenValidity },
    });

    // Create an refresh token -> session link
    const sessionRefreshTokenKey = `${SESSIONREFRESHTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:${refreshTokenKeyId}`;
    await env.OAUTHABL.put(sessionRefreshTokenKey, "", {
      metadata: { refreshTokenIndexKey, refreshTokenKey },
    });

    // Update the result
    result.refreshToken = refreshToken;
    result.refreshTokenValidity = refreshTokenValidity;
    sessionData.refreshTokenKeyId = refreshTokenKeyId;
  }

  // Save the sassion with the data
  const sessionKey = `${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`;
  await env.OAUTHABL.put(sessionKey, JSON.stringify(sessionData), {
    metadata: { createdAt: Date.now().toString() },
  });

  return result;
};

export const detectAccessToken = async (
  c: Context<{ Bindings: Bindings }>,
  returnToken?: boolean
): Promise<
  | false
  | {
      userId: string;
      clientId: string;
      expiresAt: number;
      sessionId: string;
      accessTokenIndexKey?: string;
      accessTokenKey?: string;
    }
> => {
  const now = Date.now();

  const accessTokenCookie = getCookie(c, ACCESSTOKEN_COOKIE);

  const accessTokenHeader = c.req.header("Authorization");

  if (!accessTokenCookie?.length && !accessTokenHeader?.startsWith("Bearer "))
    return false;

  const accessToken = accessTokenCookie?.length
    ? accessTokenCookie
    : accessTokenHeader!.split(" ")[1];

  const accessTokenPayload = decode(accessToken);

  if (!accessTokenPayload) return false;

  const accessTokenIndexKey = `${ACCESSTOKENINDEX_PREFIX}:${accessToken}`;

  const accessTokenKey = await c.env.OAUTHABL.get(accessTokenIndexKey);

  if (!accessTokenKey) return false;

  const accessTokenItem = await c.env.OAUTHABL.get<{
    userId: string;
    clientId: string;
    expiresAt: number;
    sessionId: string;
  }>(accessTokenKey, "json");

  if (!accessTokenItem) return false;

  if (
    accessTokenPayload.payload.clientId === accessTokenItem.clientId &&
    accessTokenPayload.payload.userId === accessTokenItem.userId &&
    accessTokenPayload.payload.expiresAt === accessTokenItem.expiresAt &&
    now < accessTokenPayload.payload.expiresAt
  ) {
    if (returnToken)
      return {
        ...accessTokenItem,
        accessTokenIndexKey,
        accessTokenKey,
      };
    return accessTokenItem;
  }

  return false;
};

export const deleteSession = async (c: Context<{ Bindings: Bindings }>) => {
  const accessTokenResult = await detectAccessToken(c, true);

  const deletions: Array<Promise<void>> = []

  if (accessTokenResult) {
    deletions.push(
      c.env.OAUTHABL.delete(accessTokenResult.accessTokenKey!),
      c.env.OAUTHABL.delete(accessTokenResult.accessTokenIndexKey!),
      c.env.OAUTHABL.delete(
        `${SESSIONACCESSTOKEN_PREFIX}:${accessTokenResult.clientId}:${accessTokenResult.userId}:${
          accessTokenResult.sessionId
        }:${accessTokenResult.accessTokenKey!.split(":")[3]}`
      ),
      c.env.OAUTHABL.delete(
        `${SESSION_PREFIX}:${accessTokenResult.clientId}:${accessTokenResult.userId}:${accessTokenResult.sessionId}`
      ),
    );
  }

  // const refreshTokenResult = await detectRefreshToken(c, true)

  // if(refreshTokenResult) {
  //   deletions.push(
      // c.env.OAUTHABL.delete(`${REFRESHTOKENINDEX_PREFIX}:${refreshToken}`),
      // c.env.OAUTHABL.delete(
      //   `${REFRESHTOKEN_PREFIX}:${clientId}:${userId}:${refreshTokenKeyId}`
      // ),
      //  c.env.OAUTHABL.delete(
      //   `${SESSIONREFRESHTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:${refreshTokenKeyId}`
      // ),
  //   )
  // }

  await Promise.all(deletions)
};
