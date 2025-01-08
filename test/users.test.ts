import { SELF } from "cloudflare:test";
import { bootstrapClient } from "./test-utils";
import type { User } from "../src/users/types";

const username = "test_user";
const email = "test@test.com";
const originalPassword = "Testp4ssw0rd!";
const newPassword = "Newtestpassword12345!";

describe("Users", () => {
  it("registers a new user", async () => {
    const { clientId, headers } = await bootstrapClient();

    const registrationResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password: originalPassword,
        }),
      },
    );

    expect(registrationResponse.status).toBe(200);

    const registrationResult = await registrationResponse.json();

    expect(registrationResult).toStrictEqual({
      username,
      emailAddresses: [email],
      id: expect.any(String),
      emailVerified: false,
    });
  });

  it("registers a new user and returns verification code", async () => {
    const { clientId, headers } = await bootstrapClient();

    const registrationResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password: originalPassword,
          verifyEmail: true,
        }),
      },
    );

    expect(registrationResponse.status).toBe(200);

    const registrationResult = await registrationResponse.json();

    expect(registrationResult).toStrictEqual({
      username,
      emailAddresses: [email],
      id: expect.any(String),
      emailVerified: false,
      code: expect.any(String),
    });
  });

  it("returns 400 if username and email aren't specified", async () => {
    const { clientId, headers } = await bootstrapClient();

    const registrationResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          password: originalPassword,
        }),
      },
    );

    expect(registrationResponse.status).toBe(400);
  });

  it("returns 422 if username is in use", async () => {
    const { clientId, headers } = await bootstrapClient();

    await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username,
        password: originalPassword,
      }),
    });

    const registrationResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          password: originalPassword,
        }),
      },
    );

    expect(registrationResponse.status).toBe(422);
  });

  it("returns 422 if email is in use", async () => {
    const { clientId, headers } = await bootstrapClient();

    await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        password: originalPassword,
      }),
    });

    const registrationResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          password: originalPassword,
        }),
      },
    );

    expect(registrationResponse.status).toBe(422);
  });

  it("returns a user by ID", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password: originalPassword,
        }),
      })
    ).json();

    const getResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}/id/${user.id}`,
      {
        headers,
      },
    );

    expect(getResponse.status).toBe(200);

    const getResult = await getResponse.json();

    expect(getResult).toStrictEqual({ ...user, sessions: expect.any(Number) });
  });

  it("returns a user by email", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password: originalPassword,
        }),
      })
    ).json();

    const getResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}/email/${
        // biome-ignore lint/style/noNonNullAssertion: Asserted in another test
        encodeURIComponent(user.emailAddresses?.[0]!)
      }`,
      {
        headers,
      },
    );

    expect(getResponse.status).toBe(200);

    const getResult = await getResponse.json();

    expect(getResult).toStrictEqual({ ...user, sessions: expect.any(Number) });
  });

  it("returns a user by username", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password: originalPassword,
        }),
      })
    ).json();

    const getResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}/username/${user.username}`,
      {
        headers,
      },
    );

    expect(getResponse.status).toBe(200);

    const getResult = await getResponse.json();

    expect(getResult).toStrictEqual({ ...user, sessions: expect.any(Number) });
  });

  it("returns 404 if user can't be found", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password: originalPassword,
        }),
      })
    ).json();

    const getResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}/email/bademailaddress@test.com`,
      {
        headers,
      },
    );

    expect(getResponse.status).toBe(404);
  });

  it("returns a list of users", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user1 = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password: originalPassword,
        }),
      })
    ).json();

    const user2 = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: `${username}1`,
          email: "test1@email.com",
          password: originalPassword,
        }),
      })
    ).json();

    const listResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}`,
      {
        headers,
      },
    );

    expect(listResponse.status).toBe(200);

    const listResult = await listResponse.json();

    expect(listResult).toContainEqual(user1);
    expect(listResult).toContainEqual(user2);
  });

  it("deletes a user", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user1 = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password: originalPassword,
        }),
      })
    ).json();

    const user2: User = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: `${username}1`,
          email: "test1@email.com",
          password: originalPassword,
        }),
      })
    ).json();

    const deleteResponse = await SELF.fetch(
      `https://api.oauthabl.com/users/${clientId}/${user2.id}`,
      {
        method: "DELETE",
        headers,
      },
    );

    expect(deleteResponse.status).toBe(200);

    const listResult = await (
      await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
        headers,
      })
    ).json();

    expect(listResult).toContainEqual(user1);
    expect(listResult).not.toContainEqual(user2);

    const getByEmailResponse = await SELF.fetch(
      `http://api.oauthabl.com/users/${clientId}/email/${
        // biome-ignore lint/style/noNonNullAssertion: Asserted in another test
        encodeURIComponent(user2.emailAddresses?.[0]!)
      }`,
      { headers },
    );

    expect(getByEmailResponse.status).toBe(404);

    const getByUsernameResponse = await SELF.fetch(
      `http://api.oauthabl.com/users/${clientId}/email/${user2.username}`,
      { headers },
    );

    expect(getByUsernameResponse.status).toBe(404);
  });
});
