import type { Context } from "hono";
import { sign } from "hono/jwt";
import hyperid from "hyperid";
import {
  ACCESSTOKENINDEX_PREFIX,
  ACCESSTOKEN_PREFIX,
  REFRESHTOKENINDEX_PREFIX,
  REFRESHTOKEN_PREFIX,
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
  SESSION_PREFIX,
} from "../../common/constants";
import type { Bindings } from "../../common/types";
import { getClient } from "../../common/utils";
import type { User } from "../../users/types";
import type { RefreshTokenResult, SessionValue, TokenPayload } from "../types";
import { detectAccessToken } from "./detect-access-token";
import { detectRefreshToken } from "./detect-refresh-token";
import { invalidateTokens } from "./invalidate-tokens";

type CreateSessionResult = {
  accessToken: string;
  accessTokenValidity: number;
  disableRefreshToken?: boolean;
  refreshToken?: string;
  refreshTokenValidity?: number;
};

export const createOrUpdateSession = async ({
  clientId,
  user: { id: userId, role },
  refreshToken: providedRefreshToken,
  refreshTokenResult: providedRefreshTokenResult,
  c,
  forceNew,
}: {
  clientId: string;
  user: Pick<User, "id" | "role">;
  refreshToken?: string;
  refreshTokenResult?: RefreshTokenResult;
  c: Context<{ Bindings: Bindings }>;
  forceNew?: boolean;
}): Promise<CreateSessionResult | false> => {
  // Detect the access token
  const accessTokenResult = await detectAccessToken(c, true);

  // Use the provided refresh token result or detect it
  const refreshTokenResult =
    providedRefreshTokenResult ??
    (await detectRefreshToken(c, providedRefreshToken, true));

  // Set the refreshTokenKey by the refreshTokenResult
  let refreshTokenKey: undefined | string | null =
    refreshTokenResult?.refreshTokenKey ?? providedRefreshToken;

  if (!refreshTokenKey && accessTokenResult) {
    // Detect the refresh token
    const session = await c.env.KV.get<SessionValue>(
      `${SESSION_PREFIX}:${accessTokenResult.clientId}:${accessTokenResult.userId}:${accessTokenResult.sessionId}`,
      "json",
    );

    if (session?.refreshTokenIndexKey) {
      // Get the refreshTokenKey
      refreshTokenKey = await c.env.KV.get(session.refreshTokenIndexKey);
    }
  }

  // Archive the current session tokens
  await invalidateTokens({
    env: c.env,
    accessTokenKey: accessTokenResult?.accessTokenKey,
    refreshTokenKey,
  });

  // Get the current time once
  const iat = Date.now();

  // Start a new hyperid instance for tokens
  const tokenIdInstance = hyperid();

  // Get the client settings
  const client = await getClient({ kv: c.env.KV, clientId });
  if (!client) return false;
  const { accessTokenValidity, disableRefreshToken, refreshTokenValidity } =
    client;

  // Re-use the provided session ID or create a new one
  const sessionId =
    !forceNew && accessTokenResult?.sessionId?.length
      ? accessTokenResult.sessionId
      : hyperid({ urlSafe: true })();

  // Create the access token data
  const accessTokenData: TokenPayload = {
    sub: userId,
    iss: "authabl",
    aud: clientId,
    iat,
    type: "access",
    exp: iat + accessTokenValidity * 1000,
    sid: sessionId,
    role,
  };
  const accessTokenString = JSON.stringify(accessTokenData);
  const accessToken = await sign(accessTokenData, c.env.ACCESSTOKEN_SECRET);

  // Create the access token with an index
  const accessTokenIndexKey = `${ACCESSTOKENINDEX_PREFIX}:${accessToken}`;
  const accessTokenKeyId = tokenIdInstance();
  const accessTokenKey = `${ACCESSTOKEN_PREFIX}:${clientId}:${userId}:${accessTokenKeyId}`;
  await c.env.KV.put(accessTokenIndexKey, accessTokenKey);
  await c.env.KV.put(accessTokenKey, accessTokenString, {
    metadata: { accessTokenValidity },
  });

  // Create an access token -> session link
  const sessionAccessTokenKey = `${SESSIONACCESSTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:${accessTokenKeyId}`;
  await c.env.KV.put(sessionAccessTokenKey, "", {
    metadata: { accessTokenIndexKey, accessTokenKey },
  });

  // Set the result
  const result: CreateSessionResult = {
    accessToken,
    accessTokenValidity,
    disableRefreshToken,
  };
  const sessionData: SessionValue = { accessTokenIndexKey, userId };

  if (!disableRefreshToken) {
    // Create the refresh token data
    const refreshTokenData: TokenPayload = {
      sub: userId,
      iss: "authabl",
      aud: clientId,
      iat,
      type: "refresh",
      exp: iat + refreshTokenValidity * 1000,
      sid: sessionId,
      role,
    };
    const refreshTokenString = JSON.stringify(refreshTokenData);

    const refreshToken = await sign(
      refreshTokenData,
      c.env.REFRESHTOKEN_SECRET,
    );

    // Create the refresh token with an index
    const refreshTokenIndexKey = `${REFRESHTOKENINDEX_PREFIX}:${refreshToken}`;
    const refreshTokenKeyId = tokenIdInstance();
    const refreshTokenKey = `${REFRESHTOKEN_PREFIX}:${clientId}:${userId}:${refreshTokenKeyId}`;
    await c.env.KV.put(refreshTokenIndexKey, refreshTokenKey);
    await c.env.KV.put(refreshTokenKey, refreshTokenString, {
      metadata: { refreshTokenValidity },
    });

    // Create an refresh token -> session link
    const sessionRefreshTokenKey = `${SESSIONREFRESHTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:${refreshTokenKeyId}`;
    await c.env.KV.put(sessionRefreshTokenKey, "", {
      metadata: { refreshTokenIndexKey, refreshTokenKey },
    });

    // Update the result
    result.refreshToken = refreshToken;
    result.refreshTokenValidity = refreshTokenValidity;
    sessionData.refreshTokenIndexKey = refreshTokenIndexKey;
  }

  // Save the sassion with the data
  const sessionKey = `${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`;
  await c.env.KV.put(sessionKey, JSON.stringify(sessionData), {
    metadata: { createdAt: iat },
  });

  return result;
};
