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
  accessTokenKeyId: string;
  refreshTokenKeyId?: string;
};

export type SessionMetadata = {
  createdAt: number
}

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
