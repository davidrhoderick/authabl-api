import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  clearSessionRoute,
  clearSessionsRoute,
  getSessionRoute,
  listSessionsRoute,
} from "./routes";
import { clientAuthentication } from "../middleware/client-authentication";
import {
  ACCESSTOKEN_PREFIX,
  REFRESHTOKEN_PREFIX,
  SESSION_PREFIX,
  SESSIONACCESSTOKEN_PREFIX,
  SESSIONREFRESHTOKEN_PREFIX,
} from "../common/constants";
import { detectAccessToken } from "../tokens/utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(listSessionsRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    const prefix = `${SESSION_PREFIX}:${clientId}:${userId}`;

    try {
      const result = await detectAccessToken(c);

      const sessions = await c.env.OAUTHABL.list({
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
  .openapi(getSessionRoute, async (c) => {
    const { clientId, userId, sessionId } = c.req.param();

    try {
      const result = await detectAccessToken(c, true);

      const session = await c.env.OAUTHABL.getWithMetadata<
        { accessTokenKeyId: string; refreshTokenKeyId: string },
        { createdAt: number }
      >(`${SESSION_PREFIX}:${clientId}:${userId}:${sessionId}`, "json");

      if (!session) return c.json({ code: 404, message: "Not found" }, 404);

      const sessionAccessTokens = await c.env.OAUTHABL.list<{
        accessTokenKey: string;
      }>({
        prefix: `${SESSIONACCESSTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}`,
      });

      const accessTokens = [];

      for (const sessionAccessToken of sessionAccessTokens.keys) {
        const { value, metadata } = await c.env.OAUTHABL.getWithMetadata<
          { userId: string; clientId: string; expiresAt: number },
          { accessTokenValidity: number }
        >(sessionAccessToken.metadata!.accessTokenKey, "json");

        const accessToken = {
          ...value!,
          ...metadata!,
          id: sessionAccessToken.metadata!.accessTokenKey.substring(
            `${ACCESSTOKEN_PREFIX}:${clientId}:${userId}:`.length
          ),
          current: false,
        };

        if (
          result &&
          sessionAccessToken.metadata!.accessTokenKey === result.accessTokenKey
        )
          accessToken.current = true;

        accessTokens.push(accessToken);
      }

      const sessionRefreshTokens = await c.env.OAUTHABL.list<{
        refreshTokenKey: string;
      }>({
        prefix: `${SESSIONREFRESHTOKEN_PREFIX}:${clientId}:${userId}:${sessionId}`,
      });

      const refreshTokens = [];

      for (const sessionRefreshToken of sessionRefreshTokens.keys) {
        const { value, metadata } = await c.env.OAUTHABL.getWithMetadata<
          { userId: string; clientId: string; expiresAt: number },
          { refreshTokenValidity: number }
        >(sessionRefreshToken.metadata!.refreshTokenKey, "json");

        const refreshToken = {
          ...value!,
          ...metadata!,
          id: sessionRefreshToken.metadata!.refreshTokenKey.substring(
            `${REFRESHTOKEN_PREFIX}:${clientId}:${userId}:`.length
          ),
          current: false,
        };

        if (refreshToken.id === session.value!.refreshTokenKeyId)
          refreshToken.current = true;

        refreshTokens.push(refreshToken);
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
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(clearSessionsRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  });

export default app;
