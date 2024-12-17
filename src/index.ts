import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import hyperid from "hyperid";
import {
  createClientRoute,
  deleteClientRoute,
  getClientRoute,
  listClientRoute,
  updateClientRoute,
} from "./routes";
import { ClientMetadata, ClientValue, Bindings } from "./types";
import { combineMetadata, splitMetadata } from "./utils";

const CLIENT_PREFIX = "client:";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.openapi(getClientRoute, async (c) => {
  const { clientId } = c.req.valid("param");

  try {
    const response = await c.env.CLIENTS.getWithMetadata<
      ClientValue,
      ClientMetadata
    >(`client:${clientId}`, "json");

    if (response.value === null || response.metadata === null)
      return c.json({ code: 404, message: "Not found" }, 404);

    // @ts-expect-error these have to not be null by now
    return c.json(combineMetadata(response), 200);
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Internal server error" }, 500);
  }
});

app.openapi(createClientRoute, async (c) => {
  const idInstance = hyperid({ urlSafe: true });
  const secretInstance = hyperid();
  const id = idInstance();
  const secret = secretInstance();

  const newClient = { ...c.req.valid("json"), id, secret };

  try {
    const { value, options } = splitMetadata(newClient);
    await c.env.CLIENTS.put(`client:${id}`, value, options);

    return c.json(newClient, 200);
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Internal server error" }, 500);
  }
});

app.openapi(listClientRoute, async (c) => {
  try {
    const clients = await c.env.CLIENTS.list<ClientMetadata>({
      prefix: CLIENT_PREFIX,
    });

    return c.json(
      clients.keys.map(({ name: id, metadata }) => ({
        id: id.substring(CLIENT_PREFIX.length),
        name: metadata?.name ?? "no name",
      })),
      200
    );
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Internal server error" }, 500);
  }
});

app.openapi(updateClientRoute, async (c) => {
  const { clientId } = c.req.valid("param");

  const clientUpdates = c.req.valid("json");

  try {
    const response = await c.env.CLIENTS.getWithMetadata<
      ClientValue,
      ClientMetadata
    >(`client:${clientId}`, "json");

    if (response.value === null || response.metadata === null)
      return c.json({ code: 404, message: "Not found" }, 404);

    // @ts-expect-error these have to not be null by now
    const oldClient = combineMetadata(response);

    try {
      const newClient = {
        ...oldClient,
        ...clientUpdates,
      };

      const { value, options } = splitMetadata(newClient);

      await c.env.CLIENTS.put(`client:${clientId}`, value, options);

      return c.json(newClient, 200);
    } catch (error) {
      console.error(error);
      return c.json({ code: 500, message: "Internal server error" }, 500);
    }
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Internal server error" }, 500);
  }
});

app.openapi(deleteClientRoute, async (c) => {
  const { clientId } = c.req.valid("param");
  try {
    await c.env.CLIENTS.delete(`client:${clientId}`);

    return c.json({ code: 200, message: "Client deleted" });
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Internal server error" }, 500);
  }
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "afabl oauth2 Admin API",
  },
});

app.get(
  "/ui",
  swaggerUI({
    url: "/doc",
  })
);

export default app;
