import { OpenAPIHono } from "@hono/zod-openapi";
import { setCookie } from "hono/cookie";
import { ACCESSTOKEN_COOKIE, REFRESHTOKEN_COOKIE } from "../common/constants";
import type { Bindings } from "../common/types";
import { loginVerification } from "../common/utils";
import { clientAuthentication } from "../middleware/client-authentication";
import {
  logoutRoute,
  mobileTokenRoute,
  refreshRoute,
  validationRoute,
  webTokenRoute,
} from "./routes";
import {
  type ArchiveSessionInput,
  archiveSession,
  createOrUpdateSession,
  detectAccessToken,
  detectRefreshToken,
} from "./utils";
import { setCookies } from "./utils/set-cookies";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(webTokenRoute, async (c) => {
    const { password, ...emailUsername } = c.req.valid("json");
    const clientId = c.req.param("clientId");

    const user = await loginVerification({
      kv: c.env.KV,
      password,
      clientId,
      ...emailUsername,
    });
    
    if (!user) return c.json({ code: 401, message: "Unauthorized" }, 401);

    const result = await createOrUpdateSession({
      clientId,
      userId: user.id,
      c,
    });

    if (!result) return c.json({ code: 401, message: "Unauthorized" }, 401);

    const { accessToken, accessTokenValidity, disableRefreshToken } = result;

    setCookies({
      c,
      accessToken,
      accessTokenValidity,
      refreshToken: !disableRefreshToken ? result.refreshToken : undefined,
      refreshTokenValidity: !disableRefreshToken
        ? result.refreshTokenValidity
        : undefined,
    });

    return c.json(user, 200);
  })
  .openapi(mobileTokenRoute, async (c) => {
    const { password, ...emailUsername } = c.req.valid("json");
    const clientId = c.req.param("clientId");

    const user = await loginVerification({
      kv: c.env.KV,
      password,
      clientId,
      ...emailUsername,
    });

    if (!user) return c.json({ code: 401, message: "Unauthorized" }, 401);

    const result = await createOrUpdateSession({
      clientId,
      userId: user.id,
      c,
    });

    if (!result) return c.json({ code: 401, message: "Unauthorized" }, 401);

    return c.json(
      {
        ...user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      200,
    );
  })
  .openapi(validationRoute, async (c) => {
    const result = await detectAccessToken(c);

    if (!result) return c.json({ code: 401, message: "Unauthorized" }, 401);

    return c.json(result, 200);
  })
  .openapi(refreshRoute, async (c) => {
    // Get the refresh token from the body
    const { refreshToken } = c.req.valid("json");

    // Detect the refresh token
    const refreshTokenResult = await detectRefreshToken(c, refreshToken, true);

    // Return 401 if refresh token isn't available or valid
    if (!refreshTokenResult)
      return c.json({ code: 401, message: "Unauthorized" }, 401);

    // Create a new session
    const sessionResult = await createOrUpdateSession({
      clientId: refreshTokenResult.clientId,
      userId: refreshTokenResult.userId,
      refreshToken,
      refreshTokenResult,
      c,
    });

    // If session creation fails, return 401
    if (!sessionResult)
      return c.json({ code: 401, message: "Unauthorized" }, 401);

    const { accessToken, accessTokenValidity, disableRefreshToken } =
      sessionResult;

    const path = "/";

    // If refresh token is currently enabled
    if (!disableRefreshToken) {
      // If we received the refresh token in the body
      if (refreshToken)
        // Return the refresh & access tokens in the response
        return c.json(
          { refreshToken: sessionResult.refreshToken, accessToken },
          200,
        );
      // Otherwise, set the refresh token as a cookie

      if (sessionResult.refreshToken)
        setCookie(c, REFRESHTOKEN_COOKIE, sessionResult.refreshToken, {
          path,
          httpOnly: true,
          maxAge: sessionResult.refreshTokenValidity,
          sameSite: "lax",
        });
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
  })
  .openapi(logoutRoute, async (c) => {
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
          input.refreshTokenIndexKey = refreshTokenResult.refreshTokenIndexKey;
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
  });

export default app;
