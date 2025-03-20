import { OpenAPIHono } from "@hono/zod-openapi";
import hyperid from "hyperid";
import {
  EMAIL_PREFIX,
  SESSION_PREFIX,
  USERNAME_PREFIX,
  USER_PREFIX,
} from "../common/constants";
import type { Bindings } from "../common/types";
import {
  generateEmailVerificationCode,
  getUserByProperty,
  hashPassword,
} from "../common/utils";
import { clientAuthentication } from "../middleware/client-authentication";
import type { SessionMetadata } from "../tokens/types";
import { archiveSession, createOrUpdateSession } from "../tokens/utils";
import {
  deleteUserRoute,
  getUserRoute,
  listUsersRoute,
  registrationRoute,
  updateUserRoute,
} from "./routes";
import type { User, UserMetadata, UserValue } from "./types";
import { combineUserMetadata, splitUserMetadata } from "./utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(registrationRoute, async (c) => {
    const createdAt = Date.now();
    const updatedAt = createdAt;
    const { password: rawPassword, ...rest } = c.req.valid("json");

    const clientId = c.req.param("clientId");
    const id = hyperid({ urlSafe: true })();

    const emailVerified = false;
    const role = rest.role ?? "user";

    const response: User & { code?: string } = {
      id,
      role,
      emailVerified,
      createdAt,
      updatedAt,
    };

    const options: { metadata: UserMetadata } = {
      metadata: { emailVerified, createdAt, updatedAt, role },
    };

    if (!rest.username?.length && !rest.email?.length)
      return c.json({ code: 400, message: "Bad Request" }, 400);

    if (rest.username) {
      const existingUserByUsername = await c.env.KV.get(
        `${USERNAME_PREFIX}:${clientId}:${rest.username}`,
      );

      if (existingUserByUsername)
        return c.json({ code: 422, message: "Unprocessable Entity" }, 422);
    }

    if (rest.email) {
      const existingUserByEmail = await c.env.KV.get(
        `${EMAIL_PREFIX}:${clientId}:${rest.email}`,
      );

      if (existingUserByEmail)
        return c.json({ code: 422, message: "Unprocessable Entity" }, 422);
    }

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
          userId: id,
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
      options,
    );

    if (!rest.verifyEmail)
      await createOrUpdateSession({
        clientId,
        user: { id, role },
        c,
        forceNew: true,
      });

    return c.json(response, 200);
  })
  .openapi(listUsersRoute, async (c) => {
    const clientId = c.req.param("clientId");
    const prefix = `${USER_PREFIX}:${clientId}:`;

    const users = await c.env.KV.list<UserMetadata>({
      prefix,
    });

    return c.json(
      (users.keys as Array<{ name: string; metadata: UserMetadata }>).map(
        ({
          name: id,
          metadata: {
            emailAddresses,
            username,
            emailVerified,
            createdAt,
            updatedAt,
            role,
          },
        }) => {
          return {
            emailAddresses: (emailAddresses ?? []).filter(
              (emailAddress) =>
                typeof emailAddress !== "undefined" || emailAddress !== null,
            ),
            username,
            id: id.substring(prefix.length),
            emailVerified,
            createdAt,
            updatedAt,
            role,
          };
        },
      ) as Array<User>,
      200,
    );
  })
  .openapi(deleteUserRoute, async (c) => {
    const { clientId, userId } = c.req.param();

    const userResponse = await c.env.KV.getWithMetadata<
      UserMetadata,
      UserValue
    >(`${USER_PREFIX}:${clientId}:${userId}`, "json");

    if (userResponse.value?.emailAddresses?.length) {
      await Promise.all(
        userResponse.value.emailAddresses.map(async (emailAddress) => {
          await c.env.KV.delete(`${EMAIL_PREFIX}:${clientId}:${emailAddress}`);
        }),
      );
    }

    if (userResponse.value?.username?.length) {
      await c.env.KV.delete(
        `${USERNAME_PREFIX}:${clientId}:${userResponse.value.username}`,
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
  })
  .openapi(getUserRoute, async (c) => {
    const { clientId, property, identifier } = c.req.param();

    const user = await getUserByProperty({
      property: property as "id" | "email" | "username",
      identifier,
      clientId,
      kv: c.env.KV,
    });

    if (!user) return c.json({ message: "Not found", code: 404 }, 404);

    const sessions = await c.env.KV.list<SessionMetadata>({
      prefix: `${SESSION_PREFIX}:${clientId}:${user.id}`,
    });

    return c.json(
      {
        id: user.id,
        emailAddresses: user.emailAddresses,
        username: user.username,
        emailVerified: user.emailVerified,
        sessions: sessions.keys.length,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
      },
      200,
    );
  })
  .openapi(updateUserRoute, async (c) => {
    const { clientId, userId } = c.req.param();
    const newUser = c.req.valid("json");

    const userKey = `${USER_PREFIX}:${clientId}:${userId}`;

    const { value, metadata } = await c.env.KV.getWithMetadata<
      UserValue,
      UserMetadata
    >(userKey, "json");

    if (!value || !metadata)
      return c.json({ message: "Not found", code: 404 }, 404);

    if (newUser.username) {
      const existingUserByUsername = await c.env.KV.get(
        `${USERNAME_PREFIX}:${clientId}:${newUser.username}`,
      );

      if (existingUserByUsername && existingUserByUsername !== userId)
        return c.json({ code: 422, message: "Unprocessable Entity" }, 422);
    }

    if (newUser.emailAddresses) {
      for (const email of newUser.emailAddresses) {
        const existingUserByEmail = await c.env.KV.get(
          `${EMAIL_PREFIX}:${clientId}:${email}`,
        );

        if (existingUserByEmail && existingUserByEmail !== userId)
          return c.json({ code: 422, message: "Unprocessable Entity" }, 422);
      }
    }

    const updatedUser = {
      ...combineUserMetadata({ id: userId, value, metadata }),
      ...newUser,
      updatedAt: Date.now(),
    };

    const { value: rawNewValue, options } = splitUserMetadata(updatedUser);

    const newValue = JSON.stringify({
      password: await hashPassword(JSON.parse(rawNewValue).password),
    } as UserValue);

    await c.env.KV.put(userKey, newValue, options);

    if (newUser.username !== metadata.username) {
      await c.env.KV.delete(
        `${USERNAME_PREFIX}:${clientId}:${metadata.username}`,
      );

      await c.env.KV.put(
        `${USERNAME_PREFIX}:${clientId}:${newUser.username}`,
        userId,
      );
    }

    if (newUser.emailAddresses?.length) {
      for (const email of newUser.emailAddresses) {
        if (!metadata.emailAddresses?.includes(email))
          await c.env.KV.put(`${EMAIL_PREFIX}:${clientId}:${email}`, userId);
      }
    }

    if (metadata.emailAddresses?.length) {
      for (const email of metadata.emailAddresses) {
        if (!newUser.emailAddresses?.includes(email))
          await c.env.KV.delete(`${EMAIL_PREFIX}:${clientId}:${email}`);
      }
    }

    const { password: _password, ...response } = updatedUser;

    return c.json(response, 200);
  });

export default app;
