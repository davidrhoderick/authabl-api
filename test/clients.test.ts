import { SELF } from "cloudflare:test";

import type { Client, NewClient, UpdateClient } from "../src/clients/types";

const client: NewClient = {
  name: "Test",
  allowedOrigins: ["http://test.com"],
  accessTokenValidity: 3600,
  refreshTokenValidity: 1209600,
  disableRefreshToken: false,
  refreshRefreshToken: true,
};

const updateClient: UpdateClient = {
  name: "Test 123",
  allowedOrigins: ["http://test.com", "https://test.app"],
  accessTokenValidity: 7200,
  refreshTokenValidity: 1209600 * 2,
  disableRefreshToken: true,
  refreshRefreshToken: false,
};

describe("Clients", () => {
  it("creates a client", async () => {
    const response = await SELF.fetch("https://api.oauthabl.com/clients", {
      method: "post",
      body: JSON.stringify(client),
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toStrictEqual({
      ...client,
      id: expect.any(String),
      secret: expect.any(String),
    });
  });

  it("gets a clients", async () => {
    const createResult: Client = await (
      await SELF.fetch("https://api.oauthabl.com/clients", {
        method: "post",
        body: JSON.stringify(client),
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();

    const response = await SELF.fetch(
      `https://api.oauthabl.com/clients/${createResult.id}`,
      {
        method: "get",
      },
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toStrictEqual(createResult);
  });

  it("returns 404 if client doesn't exist", async () => {
    const createResult: Client = await (
      await SELF.fetch("https://api.oauthabl.com/clients", {
        method: "post",
        body: JSON.stringify(client),
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();

    const updateResponse = await SELF.fetch(
      `https://api.oauthabl.com/clients/${createResult.id}1`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(updateResponse.status).toBe(404);

    const json = await updateResponse.json();

    expect(json).toStrictEqual({ message: "Not found", code: 404 });
  });

  it("lists all clients", async () => {
    const createResult: Client = await (
      await SELF.fetch("https://api.oauthabl.com/clients", {
        method: "post",
        body: JSON.stringify(client),
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();

    const response = await SELF.fetch("https://api.oauthabl.com/clients", {
      method: "get",
    });

    expect(response.status).toBe(200);

    expect(await response.json()).toStrictEqual([
      {
        name: client.name,
        id: createResult.id,
        secret: createResult.secret,
      },
    ]);
  });

  it("updates a client", async () => {
    const createResult: Client = await (
      await SELF.fetch("https://api.oauthabl.com/clients", {
        method: "post",
        body: JSON.stringify(client),
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();

    const updateResponse = await SELF.fetch(
      `https://api.oauthabl.com/clients/${createResult.id}`,
      {
        method: "patch",
        body: JSON.stringify(updateClient),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(updateResponse.status).toBe(200);

    const json = await updateResponse.json();

    expect(json).toStrictEqual({
      ...updateClient,
      id: createResult.id,
      secret: createResult.secret,
    });
  });

  it("returns 404 if updated client doesn't exist", async () => {
    const createResult: Client = await (
      await SELF.fetch("https://api.oauthabl.com/clients", {
        method: "post",
        body: JSON.stringify(client),
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();

    const updateResponse = await SELF.fetch(
      `https://api.oauthabl.com/clients/${createResult.id}1`,
      {
        method: "patch",
        body: JSON.stringify(updateClient),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(updateResponse.status).toBe(404);

    const json = await updateResponse.json();

    expect(json).toStrictEqual({ message: "Not found", code: 404 });
  });

  it("deletes a clients", async () => {
    const createResult: Client = await (
      await SELF.fetch("https://api.oauthabl.com/clients", {
        method: "post",
        body: JSON.stringify(client),
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();

    const deleteResponse = await SELF.fetch(
      `https://api.oauthabl.com/clients/${createResult.id}`,
      {
        method: "delete",
      },
    );

    expect(deleteResponse.status).toBe(200);

    const listResponse = await (
      await SELF.fetch("https://api.oauthabl.com/clients", {
        method: "get",
      })
    ).json();

    expect(listResponse).toStrictEqual([]);
  });
});
