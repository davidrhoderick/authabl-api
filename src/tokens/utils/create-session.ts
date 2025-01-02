import { sign } from "hono/jwt";
import { Bindings } from "../../common/types";
import { getClient } from "../../common/utils";
import {
  ACCESSTOKEN_PREFIX,
  ACCESSTOKENINDEX_PREFIX,
  REFRESHTOKEN_PREFIX,
  REFRESHTOKENINDEX_PREFIX,
  SESSION_PREFIX,
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
} from "../../common/constants";
import hyperid from "hyperid";
import { SessionValue, TokenPayload } from "../types";

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
    role: "user",
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
      role: "user",
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
