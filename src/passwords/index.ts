import { OpenAPIHono } from "@hono/zod-openapi";
import {
  EMAIL_PREFIX,
  FORGOTPASSWORDCODE_PREFIX,
  USER_PREFIX,
} from "../common/constants";
import type { Bindings } from "../common/types";
import {
  generateVerificationCode,
  getUserByProperty,
  hashPassword,
} from "../common/utils";
import { clientAuthentication } from "../middleware/client-authentication";
import { createOrUpdateSession } from "../tokens/utils";
import { setCookies } from "../tokens/utils/set-cookies";
import type { UserMetadata, UserValue } from "../users/types";
import { splitUserMetadata } from "../users/utils";
import {
  forgotPasswordRoute,
  mobileResetPasswordRoute,
  webResetPasswordRoute,
} from "./routes";
import { verifyForgotPasswordCode } from "./utils";
import { clearUsersSessions } from "../sessions/utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(forgotPasswordRoute, async (c) => {
    const clientId = c.req.param("clientId");
    const { email } = c.req.valid("json");

    const userId = await c.env.KV.get(`${EMAIL_PREFIX}:${clientId}:${email}`);

    if (!userId) return c.json({ message: "Not found", code: 404 }, 404);

    const user = await c.env.KV.get<UserValue>(
      `${USER_PREFIX}:${clientId}:${userId}`,
    );

    if (!user) return c.json({ message: "Not found", code: 404 }, 404);

    const code = generateVerificationCode();

    await c.env.KV.put(
      `${FORGOTPASSWORDCODE_PREFIX}:${clientId}:${userId}`,
      code,
      { expirationTtl: 60 * 15 },
    );

    return c.json({ code }, 200);
  })
  .openapi(webResetPasswordRoute, async (c) => {
    const clientId = c.req.param("clientId");
    const { email, code, password: rawPassword } = c.req.valid("json");

    if (!code) return c.json({ code: 400, message: "Bad Request" }, 400);

    const user = await getUserByProperty({
      identifier: email,
      property: "email",
      clientId,
      kv: c.env.KV,
    });

    if (!user) return c.json({ code: 404, message: "Not Found" }, 404);

    if (
      !(await verifyForgotPasswordCode({
        code,
        clientId,
        kv: c.env.KV,
        userId: user.id,
      }))
    )
      return c.json({ code: 422, message: "Unprocessable Entity" }, 422);

    const { options } = splitUserMetadata(user);

    const password = await hashPassword(rawPassword);

    await c.env.KV.put(
      `${USER_PREFIX}:${clientId}:${user.id}`,
      JSON.stringify({ password }),
      {
        ...options,
        metadata: {
          ...options.metadata,
          emailVerified: true,
        } as UserMetadata,
      },
    );

    await c.env.KV.put(`${EMAIL_PREFIX}:${clientId}:${email}`, user.id, {
      metadata: { emailVerified: true },
    });

    await clearUsersSessions({ clientId, userId: user.id, env: c.env });

    const result = await createOrUpdateSession({
      clientId,
      userId: user.id,
      c,
      forceNew: true,
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

    return c.json({ code: 200, message: "Password reset" }, 200);
  })
  .openapi(mobileResetPasswordRoute, async (c) => {
    const clientId = c.req.param("clientId");
    const { email, code, password: rawPassword } = c.req.valid("json");

    const user = await getUserByProperty({
      identifier: email,
      property: "email",
      clientId,
      kv: c.env.KV,
    });

    if (!user) return c.json({ code: 404, message: "Not Found" }, 404);

    if (
      !(await verifyForgotPasswordCode({
        code,
        clientId,
        kv: c.env.KV,
        userId: user.id,
      }))
    )
      return c.json({ code: 422, message: "Unprocessable Entity" }, 422);

    const { options } = splitUserMetadata(user);

    const password = await hashPassword(rawPassword);

    await c.env.KV.put(
      `${USER_PREFIX}:${clientId}:${user.id}`,
      JSON.stringify({ password }),
      {
        ...options,
        metadata: {
          ...options.metadata,
          emailVerified: true,
        } as UserMetadata,
      },
    );

    await c.env.KV.put(`${EMAIL_PREFIX}:${clientId}:${email}`, user.id, {
      metadata: { emailVerified: true },
    });

    await clearUsersSessions({ clientId, userId: user.id, env: c.env });

    const result = await createOrUpdateSession({
      clientId,
      userId: user.id,
      c,
      forceNew: true,
    });

    if (!result) return c.json({ code: 401, message: "Unauthorized" }, 401);

    return c.json(
      {
        ...user,
        emailVerified: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      200,
    );
  });

export default app;
