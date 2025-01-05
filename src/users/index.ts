import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  deleteUserRoute,
  forgottenPasswordRoute,
  getUserRoute,
  // forgottenPasswordRoute,
  listUsersRoute,
  registrationRoute,
} from "./routes";
import {
  EMAIL_PREFIX,
  SESSION_PREFIX,
  USER_PREFIX,
  USERNAME_PREFIX,
} from "../common/constants";
import hyperid from "hyperid";
import { generateEmailVerificationCode, hashPassword } from "../common/utils";
import { User, UserMetadata, UserValue } from "./types";
import { clientAuthentication } from "../middleware/client-authentication";
import { SessionMetadata } from "../tokens/types";
import { archiveSession, createOrUpdateSession } from "../tokens/utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(registrationRoute, async (c) => {
    const { password: rawPassword, ...rest } = c.req.valid("json");

    const clientId = c.req.param("clientId");
    const id = hyperid({ urlSafe: true })();

    const emailVerified = false;

    const response: {
      id: string;
      username?: string;
      emailAddresses?: Array<string>;
      code?: string;
      emailVerified: boolean;
    } = { id, emailVerified };

    const options: {
      metadata: {
        username?: string;
        emailAddresses?: Array<string>;
        emailVerified: boolean;
      };
    } = { metadata: { emailVerified } };

    if (!rest.username?.length && !rest.email?.length)
      return c.json({ code: 400, message: "Bad Request" }, 400);

    if (rest.username) {
      const existingUserByUsername = await c.env.KV.get(
        `${USERNAME_PREFIX}:${clientId}:${rest.username}`
      );

      if (existingUserByUsername)
        return c.json({ code: 422, message: "Unprocessable Entity" }, 422);
    }

    if (rest.email) {
      const existingUserByEmail = await c.env.KV.get(
        `${EMAIL_PREFIX}:${clientId}:${rest.email}`
      );

      if (existingUserByEmail)
        return c.json({ code: 422, message: "Unprocessable Entity" }, 422);
    }

    try {
      const password = await hashPassword(rawPassword);

      if (rest.email) {
        const { email } = rest;
        const emailAddresses = [email];
        response.emailAddresses = emailAddresses;
        options.metadata.emailAddresses = emailAddresses;
        await c.env.KV.put(`${EMAIL_PREFIX}:${clientId}:${email}`, id, {
          metadata: { emailVerified },
        });

        if (rest.verifyEmail) {
          response.code = await generateEmailVerificationCode({
            kv: c.env.KV,
            clientId,
            id,
          });
        }
      }

      if (rest.username) {
        const { username } = rest;
        response.username = username;
        options.metadata.username = username;
        await c.env.KV.put(`${USERNAME_PREFIX}:${clientId}:${username}`, id);
      }

      await c.env.KV.put(
        `${USER_PREFIX}:${clientId}:${id}`,
        JSON.stringify({ password }),
        options
      );

      if (!rest.verifyEmail)
        await createOrUpdateSession({ clientId, userId: id, c, forceNew: true });

      return c.json(response, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(listUsersRoute, async (c) => {
    const clientId = c.req.param("clientId");
    const prefix = `${USER_PREFIX}:${clientId}:`;

    try {
      const users = await c.env.KV.list<UserMetadata>({
        prefix,
      });

      return c.json(
        (users.keys as Array<{ name: string; metadata: UserMetadata }>).map(
          ({
            name: id,
            metadata: { emailAddresses, username, emailVerified },
          }) => {
            return {
              emailAddresses: (emailAddresses ?? []).filter(
                (emailAddress) =>
                  typeof emailAddress !== "undefined" || emailAddress !== null
              ),
              username,
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
      const userResponse = await c.env.KV.getWithMetadata<
        UserMetadata,
        UserValue
      >(`${USER_PREFIX}:${clientId}:${userId}`, "json");

      if (userResponse.value?.emailAddresses?.length) {
        await Promise.all(
          userResponse.value.emailAddresses.map(async (emailAddress) => {
            await c.env.KV.delete(
              `${EMAIL_PREFIX}:${clientId}:${emailAddress}`
            );
          })
        );
      }

      if (userResponse.value?.username?.length) {
        await c.env.KV.delete(
          `${USERNAME_PREFIX}:${clientId}:${userResponse.value.username}`
        );
      }

      await c.env.KV.delete(`${USER_PREFIX}:${clientId}:${userId}`);

      const sessions = await c.env.KV.list<SessionMetadata>({
        prefix: `${SESSION_PREFIX}:${clientId}:${userId}`,
      });

      if (sessions.keys.length)
        for (const session of sessions.keys) {
          await archiveSession({
            env: c.env,
            clientId,
            userId,
            sessionId: session.name,
          });
        }

      return c.json({ code: 200, message: "User deleted successfully" }, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  })
  .openapi(getUserRoute, async (c) => {
    const { clientId, userProperty, userIdentifier } = c.req.param();

    try {
      let id: string | null = userProperty === "id" ? userIdentifier : "";
      if (!id.length) {
        if (userProperty === "username")
          id = await c.env.KV.get(
            `${USERNAME_PREFIX}:${clientId}:${userIdentifier}`
          );
        else
          id = await c.env.KV.get(
            `${EMAIL_PREFIX}:${clientId}:${userIdentifier}`
          );
      }

      if (!id) return c.json({ message: "Not found", code: 404 }, 404);

      const user = await c.env.KV.getWithMetadata<UserValue, UserMetadata>(
        `${USER_PREFIX}:${clientId}:${id}`,
        "json"
      );

      if (!user.value || !user.metadata)
        return c.json({ message: "Not found", code: 404 }, 404);

      return c.json(
        {
          id,
          emailAddresses: user.metadata.emailAddresses,
          username: user.metadata.username,
          emailVerified: user.metadata.emailVerified,
        },
        200
      );
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal Server Error" }, 500);
    }
  })
  // TODO
  .openapi(forgottenPasswordRoute, async (c) => {
    // Validate the input

    // Look up the user by the email address
    // Return if not found

    // Create a unique code by user ID/email address

    // Return it to the resource server
    return c.json({ code: 200, message: "Email sent" }, 200);
  })
  // TODO Update completely for reset password
  .openapi(forgottenPasswordRoute, async (c) => {
    // Validate the input

    // Look up the user by the email address
    // Return if not found

    // Look up the code by user ID/email address
    // Return if not found

    // Validate the code

    // Update the user

    // Return success
    return c.json({ code: 200, message: "Email sent" }, 200);
  })
  // TODO Update completely for patch user
  .openapi(forgottenPasswordRoute, async (c) => {
    // Validate the input

    // Look up the user ID

    // Update the user data

    // Return the new user
    return c.json({ code: 200, message: "Email sent" }, 200);
  });

export default app;
