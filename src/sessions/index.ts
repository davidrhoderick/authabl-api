import { OpenAPIHono, type z } from "@hono/zod-openapi";
import {
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
  SESSION_PREFIX,
} from "../common/constants";
import type { Bindings } from "../common/types";
import { clientAuthentication } from "../middleware/client-authentication";
import type {
  AccessTokenMetadata,
  RefreshTokenMetadata,
  SessionAccessTokenMetadata,
  SessionMetadata,
  SessionRefreshTokenMetadata,
  SessionValue,
  TokenPayload,
} from "../tokens/types";
import {
  archiveSession,
  detectAccessToken,
  detectRefreshToken,
} from "../tokens/utils";
import {
  clearSessionRoute,
  clearSessionsRoute,
  getSessionRoute,
  listArchivedSessionsRoute,
  listSessionsRoute,
} from "./routes";
import type { AccessToken, RefreshToken } from "./schemas";
import type { ArchivedSessions } from "./types";
import { clearUsersSessions } from "./utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(listSessionsRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    const prefix = `${SESSION_PREFIX}:${clientId}:${userId}`;

    const result = await detectAccessToken(c);

    const sessions = await c.env.KV.list({
      prefix,
    });

    return c.json(
      sessions.keys.map(({ name, ...rest }) => {
        const id = name.substring(prefix.length + 1);

        return {
          id,
          current: result && id === result.sessionId,
          ...rest,
        };
      }),
      200,
    );
  })
  .openapi(listArchivedSessionsRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    const list = await c.env.R2.list({ prefix: `${clientId}/${userId}` });

    const result: ArchivedSessions = [];

    for (const listItem of list.objects) {
      const object = await c.env.R2.get(listItem.key);

      if (object) result.push(await object.json());
    }

    return c.json(result, 200);
  })
  .openapi(getSessionRoute, async (c) => {
    const { clientId, userId, sessionId } = c.req.param();

    const accessTokenResult = await detectAccessToken(c, true);

    const session = await c.env.KV.getWithMetadata<
      SessionValue,
      SessionMetadata
    >(`${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`, "json");

    if (!session?.value || !session?.metadata)
      return c.json({ code: 404, message: "Not found" }, 404);

    const sessionAccessTokenPrefix = `${SESSIONACCESSTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:`;

    const sessionAccessTokens = await c.env.KV.list<SessionAccessTokenMetadata>(
      {
        prefix: sessionAccessTokenPrefix,
      },
    );

    const accessTokens = [];

    for (const sessionAccessToken of sessionAccessTokens.keys) {
      if (sessionAccessToken.metadata) {
        const { value, metadata } = await c.env.KV.getWithMetadata<
          TokenPayload,
          AccessTokenMetadata
        >(sessionAccessToken.metadata.accessTokenKey, "json");

        if (value && metadata)
          accessTokens.push({
            ...metadata,
            current:
              accessTokenResult &&
              accessTokenResult.accessTokenIndexKey ===
                sessionAccessToken.metadata?.accessTokenIndexKey,
            createdAt: value.iat,
            expiresAt: value.exp,
            id: sessionAccessToken.name.substring(
              sessionAccessTokenPrefix.length,
            ),
          } as z.infer<typeof AccessToken>);
      }
    }

    const refreshTokenQuery = c.req.query("refreshToken");

    const refreshTokenResult = await detectRefreshToken(
      c,
      refreshTokenQuery,
      true,
    );

    const sessionRefreshTokenPrefix = `${SESSIONREFRESHTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}:`;

    const sessionRefreshTokens =
      await c.env.KV.list<SessionRefreshTokenMetadata>({
        prefix: sessionRefreshTokenPrefix,
      });

    const refreshTokens = [];

    for (const sessionRefreshToken of sessionRefreshTokens.keys) {
      if (sessionRefreshToken.metadata) {
        const { value, metadata } = await c.env.KV.getWithMetadata<
          TokenPayload,
          RefreshTokenMetadata
        >(sessionRefreshToken.metadata.refreshTokenKey, "json");

        if (value && metadata)
          refreshTokens.push({
            ...metadata,
            current:
              refreshTokenResult &&
              refreshTokenResult.refreshTokenIndexKey ===
                sessionRefreshToken.metadata?.refreshTokenIndexKey,
            createdAt: value.iat,
            expiresAt: value.exp,
            id: sessionRefreshToken.name.substring(
              sessionRefreshTokenPrefix.length,
            ),
          } as z.infer<typeof RefreshToken>);
      }
    }

    return c.json(
      {
        session: {
          id: sessionId,
          createdAt: session.metadata.createdAt,
          clientId,
          userId,
        },
        accessTokens,
        refreshTokens,
      },
      200,
    );
  })
  .openapi(clearSessionRoute, async (c) => {
    const { clientId, userId, sessionId } = c.req.param();

    const session = await c.env.KV.getWithMetadata<
      SessionValue,
      SessionMetadata
    >(`${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`, "json");

    if (session?.value && session?.metadata)
      await archiveSession({
        env: c.env,
        clientId,
        sessionId,
        ...session.value,
        ...session.metadata,
      });

    return c.json({ code: 200, message: "Cleared session" }, 200);
  })
  .openapi(clearSessionsRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    await clearUsersSessions({ clientId, userId, env: c.env });

    return c.json({ code: 200, message: "Success" }, 200);
  });

export default app;
