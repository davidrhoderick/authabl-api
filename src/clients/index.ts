import { OpenAPIHono } from "@hono/zod-openapi";
import hyperid from "hyperid";
import { CLIENT_PREFIX } from "../common/constants";
import type { Bindings } from "../common/types";
import { getClient } from "../common/utils";
import {
	createClientRoute,
	deleteClientRoute,
	getClientRoute,
	listClientRoute,
	updateClientRoute,
} from "./routes";
import type { ClientMetadata, ClientValue } from "./types";
import { combineClientMetadata, splitClientMetadata } from "./utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app
	.openapi(getClientRoute, async (c) => {
		const { clientId } = c.req.valid("param");

		const result = await getClient({ kv: c.env.KV, clientId });

		if (!result) return c.json({ code: 404, message: "Not found" }, 404);

		return c.json(result, 200);
	})
	.openapi(createClientRoute, async (c) => {
		const idInstance = hyperid({ urlSafe: true });
		const secretInstance = hyperid();
		const id = idInstance();
		const secret = secretInstance();

		const newClient = { ...c.req.valid("json"), id, secret };

		const { value, options } = splitClientMetadata(newClient);
		await c.env.KV.put(`${CLIENT_PREFIX}:${id}`, value, options);

		return c.json(newClient, 200);
	})
	.openapi(listClientRoute, async (c) => {
		const clients = await c.env.KV.list<ClientMetadata>({
			prefix: `${CLIENT_PREFIX}:`,
		});

		return c.json(
			clients.keys.length
				? clients.keys.map(({ name: id, metadata }) => ({
						id: id.substring(CLIENT_PREFIX.length + 1),
						// @ts-expect-error metadata.name is always defined
						name: metadata.name,
						// @ts-expect-error metadata.secret is always defined
						secret: metadata.secret,
					}))
				: [],
			200,
		);
	})
	.openapi(updateClientRoute, async (c) => {
		const { clientId } = c.req.valid("param");

		const clientUpdates = c.req.valid("json");

		const response = await c.env.KV.getWithMetadata<
			ClientValue,
			ClientMetadata
		>(`${CLIENT_PREFIX}:${clientId}`, "json");

		if (response.value === null || response.metadata === null)
			return c.json({ code: 404, message: "Not found" }, 404);

		// @ts-expect-error these have to not be null by now
		const oldClient = combineClientMetadata(response);

		const newClient = {
			...oldClient,
			...clientUpdates,
		};

		const { value, options } = splitClientMetadata(newClient);

		await c.env.KV.put(`${CLIENT_PREFIX}:${clientId}`, value, options);

		return c.json(newClient, 200);
	})
	.openapi(deleteClientRoute, async (c) => {
		const { clientId } = c.req.valid("param");

		await c.env.KV.delete(`${CLIENT_PREFIX}:${clientId}`);

		return c.json({ code: 200, message: "Client deleted" });
	});

export default app;
