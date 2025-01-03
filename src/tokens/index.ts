import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  logoutRoute,
  mobileTokenRoute,
  refreshRoute,
  validationRoute,
  webTokenRoute,
} from "./routes";
import { ACCESSTOKEN_COOKIE, REFRESHTOKEN_COOKIE } from "../common/constants";
import { loginVerification } from "../common/utils";
import { setCookie } from "hono/cookie";
import { clientAuthentication } from "../middleware/client-authentication";
import {
  createSession,
  archiveSession,
  detectAccessToken,
  detectRefreshToken,
  ArchiveSessionInput,
} from "./utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(webTokenRoute, async (c) => {
    const { password, ...emailUsername } = c.req.valid("json");
    const clientId = c.req.param("clientId");

    try {
      const user = await loginVerification({
        kv: c.env.KV,
        password,
        clientId,
        ...emailUsername,
      });

      if (!user) return c.json({ code: 401, message: "Unauthorized" }, 401);

      const result = await createSession({
        clientId,
        userId: user.id,
        env: c.env,
      });

      if (!result) return c.json({ code: 401, message: "Unauthorized" }, 401);

      const { accessToken, accessTokenValidity, disableRefreshToken } = result;

      const path = `/`;

      setCookie(c, ACCESSTOKEN_COOKIE, accessToken, {
        path,
        httpOnly: true,
        maxAge: accessTokenValidity,
        sameSite: "lax",
      });

      if (!disableRefreshToken) {
        setCookie(c, REFRESHTOKEN_COOKIE, result.refreshToken!, {
          path,
          httpOnly: true,
          maxAge: result.refreshTokenValidity!,
          sameSite: "lax",
        });
      }

      return c.json(user, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(mobileTokenRoute, async (c) => {
    const { password, ...emailUsername } = c.req.valid("json");
    const clientId = c.req.param("clientId");

    try {
      const user = await loginVerification({
        kv: c.env.KV,
        password,
        clientId,
        ...emailUsername,
      });

      if (!user) return c.json({ code: 401, message: "Unauthorized" }, 401);

      const result = await createSession({
        clientId,
        userId: user.id,
        env: c.env,
      });

      if (!result) return c.json({ code: 401, message: "Unauthorized" }, 401);

      return c.json(
        {
          ...user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(validationRoute, async (c) => {
    try {
      const result = await detectAccessToken(c);

      if (!result) return c.json({ code: 401, message: "Unauthorized" }, 401);

      return c.json(result, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal Server Error" }, 500);
    }
  })
  .openapi(refreshRoute, async (c) => {
    // Get the refresh token from the body
    const { refreshToken } = c.req.valid("json");

    try {
      // Detect the access token (it might not be valid)
      const accessTokenResult = await detectAccessToken(c, true);

      // Detect the refresh token
      const refreshTokenResult = await detectRefreshToken(
        c,
        refreshToken,
        true
      );

      // Return 401 if refresh token isn't available or valid
      if (!refreshTokenResult)
        return c.json({ code: 401, message: "Unauthorized" }, 401);

      // Archive the current session tokens
      await archiveSession({
        env: c.env,
        clientId: refreshTokenResult.clientId,
        userId: refreshTokenResult.userId,
        sessionId: refreshTokenResult.sessionId,
        refreshTokenKey: refreshTokenResult.refreshTokenKey,
        refreshTokenIndexKey: refreshTokenResult.refreshTokenIndexKey,
        accessTokenKey: accessTokenResult
          ? accessTokenResult.accessTokenKey
          : undefined,
        accessTokenIndexKey: accessTokenResult
          ? accessTokenResult.accessTokenIndexKey
          : undefined,
      });

      // Create a new session
      const sessionCreationResult = await createSession({
        clientId: refreshTokenResult.clientId,
        userId: refreshTokenResult.userId,
        env: c.env,
      });

      // If session creation fails, return 401
      if (!sessionCreationResult)
        return c.json({ code: 401, message: "Unauthorized" }, 401);

      const { accessToken, accessTokenValidity, disableRefreshToken } =
        sessionCreationResult;

      const path = `/`;

      // If refresh token is currently enabled
      if (!disableRefreshToken) {
        // If we received the refresh token in the body
        if (refreshToken)
          // Return the refresh & access tokens in the response
          return c.json(
            { refreshToken: sessionCreationResult.refreshToken, accessToken },
            200
          );
        // Otherwise, set the refresh token as a cookie
        else
          setCookie(
            c,
            REFRESHTOKEN_COOKIE,
            sessionCreationResult.refreshToken!,
            {
              path,
              httpOnly: true,
              maxAge: sessionCreationResult.refreshTokenValidity!,
              sameSite: "lax",
            }
          );
      }

      // If we received refresh token in the body, return the access token in the response body
      if (refreshToken) return c.json({ accessToken }, 200);

      // Otherwise, set the access token as a cookie
      setCookie(c, ACCESSTOKEN_COOKIE, accessToken, {
        path,
        httpOnly: true,
        maxAge: accessTokenValidity,
        sameSite: "lax",
      });

      // Return 200
      return c.json({ code: 200, message: "Success" }, 200);
    } catch (error) {
      console.error(error);

      return c.json({ code: 500, message: "Internal Server Error" }, 500);
    }
  })
  .openapi(logoutRoute, async (c) => {
    try {
      // Get the current access token
      const accessTokenResult = await detectAccessToken(c, true);

      const refreshTokenResult = await detectRefreshToken(c, undefined, true);

      if (accessTokenResult) {
        const input: ArchiveSessionInput = {
          env: c.env,
          clientId: accessTokenResult.clientId,
          userId: accessTokenResult.userId,
          sessionId: accessTokenResult.sessionId,
          accessTokenKey: accessTokenResult.accessTokenKey,
          accessTokenIndexKey: accessTokenResult.accessTokenIndexKey,
        };

        if (refreshTokenResult) {
          if (refreshTokenResult.refreshTokenKey)
            input.refreshTokenKey = refreshTokenResult.refreshTokenKey;

          if (refreshTokenResult.refreshTokenIndexKey)
            input.refreshTokenIndexKey =
              refreshTokenResult.refreshTokenIndexKey;
        }

        await archiveSession(input);
      }

      const path = "/";

      setCookie(c, ACCESSTOKEN_COOKIE, "", {
        path,
        httpOnly: true,
        maxAge: 0,
        sameSite: "lax",
      });

      setCookie(c, REFRESHTOKEN_COOKIE, "", {
        path,
        httpOnly: true,
        maxAge: 0,
        sameSite: "lax",
      });

      return c.json({ code: 200, message: "Success" }, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal Server Error" }, 500);
    }
  });

export default app;
