import { decode } from "hono/jwt";
import { Bindings } from "../../common/types";
import {
  REFRESHTOKEN_COOKIE,
  REFRESHTOKENINDEX_PREFIX,
} from "../../common/constants";
import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { AccessTokenResult, RefreshTokenResult, TokenPayload } from "../types";

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

  const refreshTokenIndexKey = `${REFRESHTOKENINDEX_PREFIX}:${refreshToken}`;

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
