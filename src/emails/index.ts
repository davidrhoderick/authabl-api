import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import { emailVerificationRoute, resendVerificationEmailRoute } from "./routes";
import {
  EMAIL_PREFIX,
  USER_PREFIX,
  VERIFICATIONCODE_PREFIX,
} from "../common/constants";
import { generateEmailVerificationCode, getUser } from "../common/utils";
import { UserMetadata, UserValue } from "../users/types";
import { clientAuthentication } from "../middleware/client-authentication";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
  .openapi(emailVerificationRoute, async (c) => {
    const { code, email } = c.req.valid("json");

    const clientId = c.req.param("clientId");

    try {
      const id = await c.env.OAUTHABL.get(
        `${EMAIL_PREFIX}:${clientId}:${email}`,
        "text"
      );

      if (!id) return c.json({ code: 404, message: "Not found" }, 404);

      const verificationCodeKey = `${VERIFICATIONCODE_PREFIX}:${clientId}:${id}`;

      const verificationCode = await c.env.OAUTHABL.get(verificationCodeKey);

      if (code === verificationCode) {
        const userResponse = await c.env.OAUTHABL.getWithMetadata<
          UserValue,
          UserMetadata
        >(`${USER_PREFIX}:${clientId}:${id}`, "json");

        await c.env.OAUTHABL.put(
          `${USER_PREFIX}:${clientId}:${id}`,
          JSON.stringify(userResponse.value),
          { metadata: { ...userResponse.metadata, emailVerified: true } }
        );

        await c.env.OAUTHABL.delete(verificationCodeKey);

        await c.env.OAUTHABL.put(`${EMAIL_PREFIX}:${clientId}:${email}`, id, {
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
  });

export default app;
