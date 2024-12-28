import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  clearSessionRoute,
  clearSessionsRoute,
  deleteUserRoute,
  emailVerificationRoute,
  forgottenPasswordRoute,
  listSessionsRoute,
  listUsersRoute,
  logoutRoute,
  mobileTokenRoute,
  refreshRoute,
  registrationRoute,
  resendVerificationEmailRoute,
  validationRoute,
  webTokenRoute,
} from "./routes";
import {
  ACCESSTOKEN_PREFIX,
  EMAIL_PREFIX,
  REFRESHTOKEN_PREFIX,
  USER_PREFIX,
  USERNAME_PREFIX,
  VERIFICATIONCODE_PREFIX,
} from "../common/constants";
import hyperid from "hyperid";
import {
  generateEmailVerificationCode,
  getClient,
  getUser,
  hashPassword,
  loginVerification,
} from "./utilities";
import { decode, sign } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";
import {
  EmailBody,
  User,
  UserMetadata,
  UsernameBody,
  UserValue,
} from "./types";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app
  .openapi(registrationRoute, async (c) => {
    const { password: rawPassword, ...rest } = c.req.valid("json");

    const clientId = c.req.param("clientId");
    const id = hyperid({ urlSafe: true })();

    const emailVerified = false;

    const response: {
      id: string;
      usernames?: Array<string>;
      emailAddresses?: Array<string>;
      code?: string;
      emailVerified: boolean;
    } = { id, emailVerified };

    const options: {
      metadata: {
        usernames?: Array<string>;
        emailAddresses?: Array<string>;
        emailVerified: boolean;
      };
    } = { metadata: { emailVerified } };

    try {
      const password = await hashPassword(rawPassword);

      if ((rest as EmailBody).email) {
        const { email } = rest as EmailBody;
        const emailAddresses = [email];
        response.emailAddresses = emailAddresses;
        options.metadata.emailAddresses = emailAddresses;
        await c.env.OAUTHABL.put(`${EMAIL_PREFIX}${clientId}:${email}`, id, {
          metadata: { emailVerified },
        });

        if ((rest as EmailBody).verifyEmail) {
          response.code = await generateEmailVerificationCode({
            kv: c.env.OAUTHABL,
            clientId,
            id,
          });
        }
      } else if ((rest as UsernameBody).username) {
        const { username } = rest as UsernameBody;
        const usernames = [username];
        response.usernames = usernames;
        options.metadata.usernames = usernames;
        await c.env.OAUTHABL.put(
          `${USERNAME_PREFIX}${clientId}:${username}`,
          id
        );
      }

      await c.env.OAUTHABL.put(
        `${USER_PREFIX}${clientId}:${id}`,
        JSON.stringify({ password }),
        options
      );

      return c.json(response, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(emailVerificationRoute, async (c) => {
    const { code, email } = c.req.valid("json");

    const clientId = c.req.param("clientId");

    try {
      const id = await c.env.OAUTHABL.get(
        `${EMAIL_PREFIX}${clientId}:${email}`,
        "text"
      );

      if (!id) return c.json({ code: 404, message: "Not found" }, 404);

      const verificationCodeKey = `${VERIFICATIONCODE_PREFIX}${clientId}:${id}`;

      const verificationCode = await c.env.OAUTHABL.get(verificationCodeKey);

      if (code === verificationCode) {
        const userResponse = await c.env.OAUTHABL.getWithMetadata<
          UserValue,
          UserMetadata
        >(`${USER_PREFIX}${clientId}:${id}`, "json");

        await c.env.OAUTHABL.put(
          `${USER_PREFIX}${clientId}:${id}`,
          JSON.stringify(userResponse.value),
          { metadata: { ...userResponse.metadata, emailVerified: true } }
        );

        await c.env.OAUTHABL.delete(verificationCodeKey);

        await c.env.OAUTHABL.put(`${EMAIL_PREFIX}${clientId}:${email}`, id, {
          metadata: { emailVerified: true },
        });

        return c.json({ code: 200, message: "Email verified" }, 200);
      } else {
        return c.json({ code: 422, message: "Unprocessable Entity" }, 422);
      }
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(resendVerificationEmailRoute, async (c) => {
    const clientId = c.req.param("clientId");
    const { email } = c.req.valid("json");

    try {
      const user = await getUser({ kv: c.env.OAUTHABL, email, clientId });

      if (!user?.id) return c.json({ code: 404, message: "Not found" }, 404);

      const code = await generateEmailVerificationCode({
        kv: c.env.OAUTHABL,
        clientId,
        id: user.id,
      });

      return c.json({ code }, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal Server Error" }, 500);
    }
  })
  .openapi(listUsersRoute, async (c) => {
    const clientId = c.req.param("clientId");
    const prefix = `${USER_PREFIX}${clientId}:`;

    try {
      const users = await c.env.OAUTHABL.list<UserMetadata>({
        prefix,
      });

      return c.json(
        (users.keys as Array<{ name: string; metadata: UserMetadata }>).map(
          ({
            name: id,
            metadata: { emailAddresses, usernames, emailVerified },
          }) => {
            return {
              emailAddresses: (emailAddresses ?? []).filter(
                (emailAddress) =>
                  typeof emailAddress !== "undefined" || emailAddress !== null
              ),
              usernames: (usernames ?? []).filter(
                (username) =>
                  typeof username !== "undefined" || username !== null
              ),
              id: id.substring(prefix.length),
              emailVerified,
            };
          }
        ) as Array<User>,
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(deleteUserRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    try {
      const userResponse = await c.env.OAUTHABL.getWithMetadata<
        UserMetadata,
        UserValue
      >(`${USER_PREFIX}:${clientId}:${userId}`, "json");

      if (userResponse.value?.emailAddresses?.length) {
        await Promise.all(
          userResponse.value.emailAddresses.map(async (emailAddress) => {
            await c.env.OAUTHABL.delete(
              `${EMAIL_PREFIX}:${clientId}:${emailAddress}`
            );
          })
        );
      }

      if (userResponse.value?.usernames?.length) {
        await Promise.all(
          userResponse.value.usernames.map(async (username) => {
            await c.env.OAUTHABL.delete(
              `${USERNAME_PREFIX}:${clientId}:${username}`
            );
          })
        );
      }

      await c.env.OAUTHABL.delete(`${USER_PREFIX}${clientId}:${userId}`);

      return c.json({ code: 200, message: "User deleted successfully" }, 200);
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
  .openapi(refreshRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(logoutRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(validationRoute, async (c) => {
    const accessTokenCookie = getCookie(c, "oauthabl_accesstoken");

    if (!accessTokenCookie)
      return c.json({ code: 401, message: "Unauthorized" }, 401);

    const accessTokenPayload = decode(accessTokenCookie);

    console.log("accessTokenPayload", accessTokenPayload);

    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(listSessionsRoute, async (c) => {
    return c.json([], 200);
  })
  .openapi(clearSessionRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(clearSessionsRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(forgottenPasswordRoute, async (c) => {
    return c.json({ code: 200, message: "Email sent" }, 200);
  });

export default app;
