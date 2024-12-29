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
import { decode } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";
import { clientAuthentication } from "../middleware/client-authentication";
import { createSession } from "./utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(webTokenRoute, async (c) => {
    const { password, ...emailUsername } = c.req.valid("json");
    const clientId = c.req.param("clientId");

    try {
      const user = await loginVerification({
        kv: c.env.OAUTHABL,
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

      setCookie(c, ACCESSTOKEN_COOKIE, accessToken, {
        path: `/oauth/${clientId}`,
        httpOnly: true,
        maxAge: accessTokenValidity,
        sameSite: "strict",
      });

      if (!disableRefreshToken) {
        setCookie(c, REFRESHTOKEN_COOKIE, result.refreshToken!, {
          path: `/oauth/${clientId}`,
          httpOnly: true,
          maxAge: result.refreshTokenValidity!,
          sameSite: "strict",
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
      const result = await loginVerification({
        kv: c.env.OAUTHABL,
        password,
        clientId,
        ...emailUsername,
      });

      if (!result) return c.json({ code: 401, message: "Unauthorized" }, 401);

      return c.json(result, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(validationRoute, async (c) => {
    const accessTokenCookie = getCookie(c, ACCESSTOKEN_COOKIE);

    if (!accessTokenCookie)
      return c.json({ code: 401, message: "Unauthorized" }, 401);

    const accessTokenPayload = decode(accessTokenCookie);

    console.log("accessTokenPayload", accessTokenPayload);

    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(refreshRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(logoutRoute, async (c) => {
    const accessTokenCookie = getCookie(c, ACCESSTOKEN_COOKIE);
    const refreshTokenCookie = getCookie(c, REFRESHTOKEN_COOKIE);

    return c.json({ code: 200, message: "Success" }, 200);
  });

export default app;
