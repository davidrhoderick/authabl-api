import { Bindings } from "../../common/types";
import { AccessTokenMetadata, TokenPayload } from "../types";

export const invalidateTokens = async ({
  env,
  accessTokenKey,
  refreshTokenKey,
}: {
  env: Bindings;
  accessTokenKey?: string | false | null;
  refreshTokenKey?: string | false | null;
}) => {
  const revokedAt = Date.now();

  if (accessTokenKey) {
    const accessToken = await env.KV.getWithMetadata<
      TokenPayload,
      AccessTokenMetadata
    >(accessTokenKey, "json");

    if (
      accessToken.value &&
      accessToken.metadata &&
      !accessToken.metadata.revokedAt
    ) {
      await env.KV.put(accessTokenKey, JSON.stringify(accessToken.value), {
        metadata: { ...accessToken.metadata, revokedAt },
      });
    }
  }

  if (refreshTokenKey) {
    const refreshToken = await env.KV.getWithMetadata<
      TokenPayload,
      AccessTokenMetadata
    >(refreshTokenKey, "json");

    if (
      refreshToken.value &&
      refreshToken.metadata &&
      !refreshToken.metadata.revokedAt
    ) {
      await env.KV.put(refreshTokenKey, JSON.stringify(refreshToken.value), {
        metadata: { ...refreshToken.metadata, revokedAt },
      });
    }
  }
};
