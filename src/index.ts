import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";

import clients from "./clients";
import oauth from "./oauth";

const app = new OpenAPIHono();

app.use("*", cors()).route("/clients", clients).route("/oauth", oauth);

app.openAPIRegistry.registerComponent("securitySchemes", "Client", {
  type: "apiKey",
})

app.openAPIRegistry.registerComponent("securitySchemes", "User", {
  type: "oauth2",
  scheme: "password",
  flows: {
    password: {
      tokenUrl: "/oauth/token",
      scopes: {},
    },
  },
  in: "cookie",
  name: 'oauthabl'
});

app
  .doc("/openapi", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "oauthabl API",
    },
  })
  .get(
    "/swagger",
    swaggerUI({
      url: "/openapi",
      title: "oauthabl API",
      manuallySwaggerUIHtml: (asset) => `
         <div>
           <div id="swagger-ui"></div>
           ${asset.css.map((url) => `<link rel="stylesheet" href="${url}" />`)}
           <link rel="stylesheet" href="/SwaggerDark.css" />
           ${asset.js.map(
             (url) => `<script src="${url}" crossorigin="anonymous"></script>`
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
    })
  );

export default app;
