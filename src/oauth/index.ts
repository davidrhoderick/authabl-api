import { OpenAPIHono } from "@hono/zod-openapi";
import { Bindings } from "../common/types";
import {
  clearSessionRoute,
  clearSessionsRoute,
  emailVerificationRoute,
  forgottenPasswordRoute,
  listSessionsRoute,
  logoutRoute,
  refreshRoute,
  registrationRoute,
  resendVerificationEmailRoute,
  tokenRoute,
  validationRoute,
} from "./routes";
import { Resend } from "resend";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app
  .openapi(registrationRoute, async (c) => {
    const { email, password } = c.req.valid("json");
    const { client_id, client_secret } = c.req.valid("header");

    console.log(client_id, client_secret, email, password);

    const resend = new Resend(c.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Authentication <oauthabl@afabl.com>",
      to: [email],
      subject: "hello world",
      html: "<p>it works!</p>",
    });

    return c.json({ code: 200, message: "Success" });
  })
  .openapi(tokenRoute, async (c) => {
    const { email, password } = c.req.valid("json");
    const { client_id, client_secret } = c.req.valid("header");

    console.log(client_id, client_secret, email, password);

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
