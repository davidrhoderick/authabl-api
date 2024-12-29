import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  deleteUserRoute,
  // forgottenPasswordRoute,
  listUsersRoute,
  registrationRoute,
} from "./routes";
import {
  EMAIL_PREFIX,
  USER_PREFIX,
  USERNAME_PREFIX,
} from "../common/constants";
import hyperid from "hyperid";
import { generateEmailVerificationCode, hashPassword } from "../common/utils";
import { User, UserMetadata, UserValue } from "./types";
import { clientAuthentication } from "../middleware/client-authentication";

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

    try {
      const password = await hashPassword(rawPassword);

      if (rest.email) {
        const { email } = rest;
        const emailAddresses = [email];
        response.emailAddresses = emailAddresses;
        options.metadata.emailAddresses = emailAddresses;
        await c.env.OAUTHABL.put(`${EMAIL_PREFIX}:${clientId}:${email}`, id, {
          metadata: { emailVerified },
        });

        if (rest.verifyEmail) {
          response.code = await generateEmailVerificationCode({
            kv: c.env.OAUTHABL,
            clientId,
            id,
          });
        }
      } else if (rest.username) {
        const { username } = rest;
        response.username = username;
        options.metadata.username = username;
        await c.env.OAUTHABL.put(
          `${USERNAME_PREFIX}:${clientId}:${username}`,
          id
        );
      }

      await c.env.OAUTHABL.put(
        `${USER_PREFIX}:${clientId}:${id}`,
        JSON.stringify({ password }),
        options
      );

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
      const users = await c.env.OAUTHABL.list<UserMetadata>({
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

      if (userResponse.value?.username?.length) {
        await c.env.OAUTHABL.delete(
          `${USERNAME_PREFIX}:${clientId}:${userResponse.value.username}`
        );
      }

      await c.env.OAUTHABL.delete(`${USER_PREFIX}:${clientId}:${userId}`);

      return c.json({ code: 200, message: "User deleted successfully" }, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  });
// .openapi(forgottenPasswordRoute, async (c) => {
//   return c.json({ code: 200, message: "Email sent" }, 200);
// });

export default app;
