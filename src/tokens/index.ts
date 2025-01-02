import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  mobileLogoutRoute,
  mobileTokenRoute,
  refreshRoute,
  validationRoute,
  webLogoutRoute,
  webTokenRoute,
} from "./routes";
import { ACCESSTOKEN_COOKIE, REFRESHTOKEN_COOKIE } from "../common/constants";
import { loginVerification } from "../common/utils";
import { setCookie } from "hono/cookie";
import { clientAuthentication } from "../middleware/client-authentication";
import { createSession, deleteSession, detectAccessToken } from "./utils";

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
      const result = await loginVerification({
        kv: c.env.KV,
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
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(webLogoutRoute, async (c) => {
    try {
      await deleteSession(c);

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
  })
  .openapi(mobileLogoutRoute, async (c) => {
    const { refreshToken } = c.req.valid("json");

    try {
      await deleteSession(c, refreshToken);

      return c.json({ code: 200, message: "Success" }, 200);
    } catch (error) {
      return c.json({ code: 500, message: "Internal Server Error" }, 500);
    }
  });

export default app;
