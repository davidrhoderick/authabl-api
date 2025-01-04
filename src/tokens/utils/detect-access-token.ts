import { decode } from "hono/jwt";
import { Bindings } from "../../common/types";
import {
  ACCESSTOKEN_COOKIE,
  ACCESSTOKENINDEX_PREFIX,
} from "../../common/constants";
import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { AccessTokenMetadata, AccessTokenResult, TokenPayload } from "../types";

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

  const accessTokenItem = await c.env.KV.getWithMetadata<
    TokenPayload,
    AccessTokenMetadata
  >(accessTokenKey, "json");

  if (!accessTokenItem.value || !accessTokenItem.metadata) return false;

  const { payload } = decodedAccessToken as unknown as {
    payload: TokenPayload;
  };

  if (
    payload.iss === "oauthabl" &&
    payload.iss === accessTokenItem.value.iss &&
    payload.sub === accessTokenItem.value.sub &&
    payload.exp === accessTokenItem.value.exp &&
    now < payload.exp &&
    now > payload.iat &&
    (!accessTokenItem.metadata.revokedAt ||
      now < accessTokenItem.metadata.revokedAt)
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
