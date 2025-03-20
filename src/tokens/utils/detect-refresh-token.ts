import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { decode } from "hono/jwt";
import {
  REFRESHTOKENINDEX_PREFIX,
  REFRESHTOKEN_COOKIE,
} from "../../common/constants";
import type { Bindings } from "../../common/types";
import type {
  AccessTokenResult,
  RefreshTokenMetadata,
  RefreshTokenResult,
  TokenPayload,
} from "../types";

export const detectRefreshToken = async (
  c: Context<{ Bindings: Bindings }>,
  refreshTokenBody?: string,
  returnToken?: boolean,
): Promise<undefined | RefreshTokenResult> => {
  const now = Date.now();

  const refreshTokenCookie = getCookie(c, REFRESHTOKEN_COOKIE);

  if (!refreshTokenCookie?.length && !refreshTokenBody?.length) return;

  const refreshToken = refreshTokenCookie?.length
    ? refreshTokenCookie
    : refreshTokenBody;

  if (!refreshToken) return;

  const decodedRefreshToken = decode(refreshToken);

  if (!decodedRefreshToken) return;

  const refreshTokenIndexKey = `${REFRESHTOKENINDEX_PREFIX}:${refreshToken}`;

  const refreshTokenKey = await c.env.KV.get(refreshTokenIndexKey);

  if (!refreshTokenKey) return;

  const refreshTokenItem = await c.env.KV.getWithMetadata<
    TokenPayload,
    RefreshTokenMetadata
  >(refreshTokenKey, "json");

  if (!refreshTokenItem.value || !refreshTokenItem.metadata) return;

  const { payload } = decodedRefreshToken as unknown as {
    payload: TokenPayload;
  };

  if (
    payload.iss === "authabl" &&
    payload.aud === refreshTokenItem.value.aud &&
    payload.sub === refreshTokenItem.value.sub &&
    payload.exp === refreshTokenItem.value.exp &&
    now < payload.exp &&
    now > payload.iat &&
    (!refreshTokenItem.metadata.revokedAt ||
      now < refreshTokenItem.metadata.revokedAt)
  ) {
    const result: AccessTokenResult = {
      userId: payload.sub,
      clientId: payload.aud,
      expiresAt: payload.exp,
      createdAt: payload.iat,
      sessionId: payload.sid,
      role: payload.role,
    };

    if (returnToken)
      return {
        ...result,
        refreshTokenIndexKey,
        refreshTokenKey,
      };
    return result;
  }

  return;
};
