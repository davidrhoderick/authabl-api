import { Hono } from "hono";
import hyperid from "hyperid";
import type { Client, ClientValue } from "./clients/types";
import { splitClientMetadata } from "./clients/utils";
import {
  AUTHABL_CLIENTID,
  CLIENT_PREFIX,
  EMAIL_PREFIX,
  USER_PREFIX,
} from "./common/constants";
import type { Bindings } from "./common/types";
import { hashPassword } from "./common/utils";
import type { UserMetadata, UserValue } from "./users/types";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/", async (c) => {
  const authorizationHeader = c.req.header("Authorization");
  const seedToken = authorizationHeader?.split("Bearer ")[1];

  if (seedToken !== c.env.SEED_TOKEN)
    return c.json({ message: "Unauthorized", code: 401 }, 401);

  try {
    const clientKey = `${CLIENT_PREFIX}:${AUTHABL_CLIENTID}`;
    const clientExists = await c.env.KV.get<ClientValue>(clientKey);

    if (!clientExists) {
      const authablClientSecret = hyperid()();
      const client: Client = {
        id: "authabl",
        name: "authabl",
        allowedOrigins: ["http://localhost:8787", "https://api.authabl.com"],
        accessTokenValidity: 3600,
        refreshTokenValidity: 1209600,
        disableRefreshToken: false,
        refreshRefreshToken: true,
        secret: authablClientSecret,
      };

      const dopplerSecretUpdateOptions = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${c.env.DOPPLER_SDK_SERVICE_TOKEN}`,
        },
        body: JSON.stringify({
          project: c.env.DOPPLER_PROJECT,
          config: c.env.DOPPLER_CONFIG,
          secrets: {
            AUTHABL_CLIENT_SECRET: authablClientSecret,
          },
        }),
      };

      const response = await fetch(
        "https://api.doppler.com/v3/configs/config/secrets",
        dopplerSecretUpdateOptions,
      );

      const data: { success: boolean; messages: Array<string> } =
        await response.json();

      if (!data.success)
        return c.json({ message: data.messages.join(", "), code: 500 }, 500);

      const { value, options } = splitClientMetadata(client);

      await c.env.KV.put(clientKey, value, options);
      console.log("Created authabl client with ID");
    } else {
      console.log("authabl client already exists");
    }

    const emailKey = `${EMAIL_PREFIX}:${AUTHABL_CLIENTID}:${c.env.SUPERADMIN_EMAIL}`;
    const userId = await c.env.KV.get(emailKey);
    if (userId) {
      const userKey = `${USER_PREFIX}:${AUTHABL_CLIENTID}:${userId}`;
      const userExists = await c.env.KV.get<UserValue>(userKey, "json");
      if (userExists) {
        console.log("Superadmin already exists");
      } else {
        console.error("Inconsistent state: Email key found, but user missing");
      }
    } else {
      // Create the superadmin user
      const newUserId = crypto.randomUUID();
      const createdAt = Date.now();
      const updatedAt = createdAt;
      const value: UserValue = {
        password: await hashPassword(c.env.SUPERADMIN_PASSWORD),
      };
      const metadata: UserMetadata = {
        emailAddresses: [c.env.SUPERADMIN_EMAIL],
        emailVerified: true,
        createdAt,
        updatedAt,
        role: "superadmin",
      };

      // Save the user
      const userKey = `${USER_PREFIX}:${AUTHABL_CLIENTID}:${newUserId}`;
      await c.env.KV.put(userKey, JSON.stringify(value), { metadata });
      await c.env.KV.put(emailKey, newUserId);

      console.log("Created superadmin");
    }
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal Server Error", code: 500 }, 500);
  }

  // Return the response
  return c.json({ message: "Created superadmin", code: 200 }, 200);
});

export default app;
