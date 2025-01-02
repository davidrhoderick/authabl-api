export type TokenPayload = {
  sub: string;
  iss: "oauthabl";
  exp: number;
  aud: string;
  iat: number;
  type: "access" | "refresh";
  sid: string;
  role?: string;
};

export type SessionValue = {
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
};

export type RefreshTokenResult = {
  userId: string;
  clientId: string;
  createdAt: number;
  expiresAt: number;
  sessionId: string;
  refreshTokenIndexKey?: string;
  refreshTokenKey?: string;
};

export type AccessTokenMetadata = {
  accessTokenValidity: number;
};

export type RefreshTokenMetadata = {
  refreshTokenValidity: number;
};
