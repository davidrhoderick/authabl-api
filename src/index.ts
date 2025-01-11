import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";

import clients from "./clients";
import emails from "./emails";
import passwords from "./passwords";
import seed from "./seed";
import sessions from "./sessions";
import tokens from "./tokens";
import users from "./users";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono();

app
  .use("*", cors())
  // Client applications
  .route("/clients", clients)
  // Users on clients
  .route("/users", users)
  // Password management
  .route("/passwords", passwords)
  // Email addresses for users
  .route("/emails", emails)
  // Token management for users
  .route("/tokens", tokens)
  // Session management for users
  .route("/sessions", sessions)
  // Seed the database
  .route("/seed", seed)
  // Handle errors
  .onError((error, c) => {
    if (error instanceof HTTPException) return error.getResponse();

    return c.json({ code: 500, message: "Internal server error" }, 500);
  });

app.openAPIRegistry.registerComponent("securitySchemes", "Client", {
  type: "apiKey",
  in: "header",
  name: "X-AUTHABL-API-KEY",
});

app.openAPIRegistry.registerComponent("securitySchemes", "Mobile", {
  type: "http",
  in: "header",
  name: "Authorization",
});

app
  .doc("/openapi", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "authabl API",
    },
  })
  .get(
    "/swagger",
    swaggerUI({
      url: "/openapi",
      title: "authabl API",
      manuallySwaggerUIHtml: (asset) => `
         <div>
           <div id="swagger-ui"></div>
           ${asset.css.map((url) => `<link rel="stylesheet" href="${url}" />`)}
           <link rel="stylesheet" href="/SwaggerDark.css" />
           ${asset.js.map(
             (url) => `<script src="${url}" crossorigin="anonymous"></script>`,
           )}
           <script>
             window.onload = () => {
               window.ui = SwaggerUIBundle({
                 dom_id: '#swagger-ui',
                 url: '/openapi',
               })
             }
           </script>
         </div>`,
    }),
  );

export default app;
