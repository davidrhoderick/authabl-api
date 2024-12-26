import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  clearSessionRoute,
  clearSessionsRoute,
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
import { Resend } from "resend";
import {
  CLIENT_PREFIX,
  EMAIL_PREFIX,
  USER_PREFIX,
  USERNAME_PREFIX,
} from "../common/constants";
import hyperid from "hyperid";
import { hashPassword } from "./utilities";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app
  .openapi(registrationRoute, async (c) => {
    const { password: rawPassword, ...emailOrUsername } = c.req.valid("json");

    const clientId = c.req.param("clientId");
    const id = hyperid({ urlSafe: true })();
    const usernames = [(emailOrUsername as { username?: string }).username];
    const emailAddresses = [(emailOrUsername as { email?: string }).email];
    const options = { metadata: { usernames, emailAddresses } };

    try {
      const password = await hashPassword(rawPassword);

      await c.env.OAUTHABL.put(
        `${USER_PREFIX}${clientId}:${id}`,
        JSON.stringify({ password }),
        options
      );

      if (emailAddresses.length) {
        await c.env.OAUTHABL.put(
          `${EMAIL_PREFIX}${clientId}:${emailAddresses[0]}`,
          id
        );
      } else {
        await c.env.OAUTHABL.put(
          `${USERNAME_PREFIX}${clientId}:${usernames[0]}`,
          id
        );
      }

      return c.json(
        {
          id,
          emailAddresses,
          usernames,
        },
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(listUsersRoute, async (c) => {
    const clientId = c.req.param("clientId");
    const prefix = `${USER_PREFIX}${clientId}:`;

    try {
      const users = await c.env.OAUTHABL.list({
        prefix,
      });

      return c.json(
        users.keys.map(({ name: id, metadata }) => ({
          ...(metadata as {
            emailAddresses: Array<string>;
            usernames: Array<string>;
          }),
          id: id.substring(prefix.length),
        })),
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(mobileTokenRoute, async (c) => {
    const { email, password } = c.req.valid("json");

    console.log(email, password);

    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(webTokenRoute, async (c) => {
    const { email, password } = c.req.valid("json");

    console.log(email, password);

    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(refreshRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(logoutRoute, async (c) => {
    return c.json({ code: 200, message: "Success" }, 200);
  })
  .openapi(validationRoute, async (c) => {
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
  .openapi(emailVerificationRoute, async (c) => {
    return c.json({ code: 200, message: "Email sent" }, 200);
  })
  .openapi(forgottenPasswordRoute, async (c) => {
    return c.json({ code: 200, message: "Email sent" }, 200);
  })
  .openapi(resendVerificationEmailRoute, async (c) => {
    return c.json({ code: 200, message: "Code resent" }, 200);
  });

export default app;
