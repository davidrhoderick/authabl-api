import type { z } from "@hono/zod-openapi";
import type { TokenPayloadSchema } from "../sessions/schemas";
import type { MobileTokenResponseSchema } from "./schemas";

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export type MobileTokenResponse = z.infer<typeof MobileTokenResponseSchema>;

export type SessionValue = {
  userId: string;
  accessTokenIndexKey: string;
  refreshTokenIndexKey?: string;
};

export type SessionMetadata = {
  createdAt: number;
};

export type SessionAccessTokenMetadata = {
  accessTokenIndexKey: string;
  accessTokenKey: string;
};

export type SessionRefreshTokenMetadata = {
  refreshTokenIndexKey: string;
  refreshTokenKey: string;
};

export type AccessTokenResult = {
  userId: string;
  clientId: string;
  createdAt: number;
  expiresAt: number;
  sessionId: string;
  accessTokenIndexKey?: string;
  accessTokenKey?: string;
  role: string;
};

export type RefreshTokenResult = {
  userId: string;
  clientId: string;
  createdAt: number;
  expiresAt: number;
  sessionId: string;
  refreshTokenIndexKey?: string;
  refreshTokenKey?: string;
  role: string;
};

export type AccessTokenMetadata = {
  accessTokenValidity: number;
  revokedAt?: number;
};

export type RefreshTokenMetadata = {
  refreshTokenValidity: number;
  revokedAt?: number;
};
