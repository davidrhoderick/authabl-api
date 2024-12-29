import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  logoutRoute,
  mobileTokenRoute,
  refreshRoute,
  validationRoute,
  webTokenRoute,
} from "./routes";
import { ACCESSTOKEN_PREFIX, REFRESHTOKEN_PREFIX } from "../common/constants";
import { getClient, loginVerification } from "../common/utilities";
import { decode, sign } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";
import { clientAuthentication } from "../middleware/client-authentication";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("*", clientAuthentication);

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

      const client = await getClient({ kv: c.env.OAUTHABL, clientId });

      if (!client) return c.json({ code: 401, message: "Unauthorized" }, 401);

      const { accessTokenValidity, disableRefreshToken, refreshTokenValidity } =
        client;

      const accessTokenData = {
        userId: user.id,
        clientId,
        expiresAt: Date.now() + accessTokenValidity * 1000,
      };
      const accessTokenString = JSON.stringify(accessTokenData);

      const accessToken = await sign(accessTokenData, c.env.ACCESSTOKEN_SECRET);

      const accessTokenKey = `${ACCESSTOKEN_PREFIX}:${clientId}:${user.id}:${accessToken}`;

      await c.env.OAUTHABL.put(accessTokenKey, accessTokenString, {
        expirationTtl: accessTokenValidity,
        metadata: { accessTokenValidity },
      });

      setCookie(c, "oauthabl_accesstoken", accessToken, {
        path: `/oauth/${clientId}`,
        httpOnly: true,
        maxAge: accessTokenValidity,
        sameSite: "strict",
      });

      if (!disableRefreshToken) {
        const refreshTokenData = {
          userId: user.id,
          clientId,
          expiresAt: Date.now() + refreshTokenValidity * 1000,
        };
        const refreshTokenString = JSON.stringify(refreshTokenData);

        const refreshToken = await sign(
          refreshTokenData,
          c.env.REFRESHTOKEN_SECRET
        );

        const refreshTokenKey = `${REFRESHTOKEN_PREFIX}:${clientId}:${user.id}:${refreshToken}`;

        await c.env.OAUTHABL.put(refreshTokenKey, refreshTokenString, {
          expirationTtl: refreshTokenValidity,
          metadata: { refreshTokenValidity },
        });

        setCookie(c, "oauthabl_refreshtoken", refreshToken, {
          path: `/oauth/${clientId}`,
          httpOnly: true,
          maxAge: refreshTokenValidity,
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
    const accessTokenCookie = getCookie(c, "oauthabl_accesstoken");

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
    return c.json({ code: 200, message: "Success" }, 200);
  });

export default app;
