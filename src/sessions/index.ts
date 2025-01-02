import { OpenAPIHono, z } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  clearSessionRoute,
  clearSessionsRoute,
  getSessionRoute,
  listArchivedSessionsRoute,
  listSessionsRoute,
} from "./routes";
import { clientAuthentication } from "../middleware/client-authentication";
import {
  SESSION_PREFIX,
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
} from "../common/constants";
import { detectAccessToken, detectRefreshToken } from "../tokens/utils";
import {
  AccessTokenMetadata,
  RefreshTokenMetadata,
  SessionAccessTokenMetadata,
  SessionMetadata,
  SessionRefreshTokenMetadata,
  SessionValue,
  TokenPayload,
} from "../tokens/types";
import { AccessToken, RefreshToken } from "./schemas";
import { ArchivedSessions } from "./types";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(listSessionsRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    const prefix = `${SESSION_PREFIX}:${clientId}:${userId}`;

    try {
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
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal Server Error" }, 500);
    }
  })
  .openapi(listArchivedSessionsRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    try {
      const list = await c.env.R2.list({ prefix: `${clientId}/${userId}` });

      const result: ArchivedSessions = [];

      for (const listItem of list.objects) {
        const object = await c.env.R2.get(listItem.key);

        if (object) result.push(await object.json());
      }

      return c.json(result, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Internal Server Error", code: 500 }, 500);
    }
  })
  .openapi(getSessionRoute, async (c) => {
    const { clientId, userId, sessionId } = c.req.param();

    try {
      const accessTokenResult = await detectAccessToken(c, true);

      const session = await c.env.KV.getWithMetadata<
        SessionValue,
        SessionMetadata
      >(`${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`, "json");

      if (!session?.value)
        return c.json({ code: 404, message: "Not found" }, 404);

      const sessionAccessTokens =
        await c.env.KV.list<SessionAccessTokenMetadata>({
          prefix: `${SESSIONACCESSTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}`,
        });

      const accessTokens = [];

      for (const sessionAccessToken of sessionAccessTokens.keys) {
        const { value, metadata } = await c.env.KV.getWithMetadata<
          TokenPayload,
          AccessTokenMetadata
        >(sessionAccessToken.metadata!.accessTokenKey, "json");

        if (value)
          accessTokens.push({
            ...metadata!,
            current:
              accessTokenResult &&
              accessTokenResult.accessTokenIndexKey ===
                sessionAccessToken.metadata?.accessTokenIndexKey,
            id: value.sid,
            clientId: value.aud,
            userId: value.sub,
            createdAt: value.iat,
            expiresAt: value.exp,
          } as z.infer<typeof AccessToken>);
      }

      const refreshTokenQuery = c.req.query("refreshToken");

      const refreshTokenResult = await detectRefreshToken(
        c,
        refreshTokenQuery,
        true
      );

      const sessionRefreshTokens =
        await c.env.KV.list<SessionRefreshTokenMetadata>({
          prefix: `${SESSIONREFRESHTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}`,
        });

      const refreshTokens = [];

      for (const sessionRefreshToken of sessionRefreshTokens.keys) {
        const { value, metadata } = await c.env.KV.getWithMetadata<
          TokenPayload,
          RefreshTokenMetadata
        >(sessionRefreshToken.metadata!.refreshTokenKey, "json");

        if (value)
          refreshTokens.push({
            ...metadata!,
            current:
              refreshTokenResult &&
              refreshTokenResult.refreshTokenIndexKey ===
                sessionRefreshToken.metadata?.refreshTokenIndexKey,
            id: value.sid,
            clientId: value.aud,
            userId: value.sub,
            createdAt: value.iat,
            expiresAt: value.exp,
          } as z.infer<typeof RefreshToken>);
      }

      return c.json(
        {
          session: {
            id: sessionId,
            createdAt: session.metadata!.createdAt,
          },
          accessTokens,
          refreshTokens,
        },
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal Server Error" }, 500);
    }
  })
  .openapi(clearSessionRoute, async (c) => {
    // TODO
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(clearSessionsRoute, async (c) => {
    // TODO
    return c.json({ code: 200, message: "Success" }, 200);
  });

export default app;
