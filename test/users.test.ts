import { SELF } from "cloudflare:test";
import type { User } from "../src/users/types";
import { bootstrapClient } from "./test-utils";

const username = "test_user";
const email = "test@test.com";
const password = "Testp4ssw0rd!";
const newUsername = "test_user_2";
const newEmail = "test2@test.com";
const newPassword = "Newtestpassword12345!";

describe("Users", () => {
  it("registers a new user", async () => {
    const { clientId, headers } = await bootstrapClient();

    const registrationResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
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
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      role: "user",
    });
  });

  it("registers a new user and returns verification code", async () => {
    const { clientId, headers } = await bootstrapClient();

    const registrationResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
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
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      role: "user",
    });
  });

  it("returns 400 if username and email aren't specified", async () => {
    const { clientId, headers } = await bootstrapClient();

    const registrationResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          password,
        }),
      },
    );

    expect(registrationResponse.status).toBe(400);
  });

  it("returns 422 if username is in use", async () => {
    const { clientId, headers } = await bootstrapClient();

    await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const registrationResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          password,
        }),
      },
    );

    expect(registrationResponse.status).toBe(422);
  });

  it("returns 422 if email is in use", async () => {
    const { clientId, headers } = await bootstrapClient();

    await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const registrationResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    expect(registrationResponse.status).toBe(422);
  });

  it("returns a user by ID", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })
    ).json();

    const getResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/id/${user.id}`,
      {
        headers,
      },
    );

    expect(getResponse.status).toBe(200);

    const getResult = await getResponse.json();

    expect(getResult).toStrictEqual({
      ...user,
      sessions: expect.any(Number),
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      role: "user",
    });
  });

  it("returns a user by email", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })
    ).json();

    const getResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/email/${
        // biome-ignore lint/style/noNonNullAssertion: Asserted in another test
        encodeURIComponent(user.emailAddresses?.[0]!)
      }`,
      {
        headers,
      },
    );

    expect(getResponse.status).toBe(200);

    const getResult = await getResponse.json();

    expect(getResult).toStrictEqual({
      ...user,
      sessions: expect.any(Number),
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
  });

  it("returns a user by username", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })
    ).json();

    const getResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/username/${user.username}`,
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

    await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const getResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/email/bademailaddress@test.com`,
      {
        headers,
      },
    );

    expect(getResponse.status).toBe(404);
  });

  it("returns a list of users", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user1: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })
    ).json();

    const user2: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: `${username}1`,
          email: "test1@email.com",
          password,
        }),
      })
    ).json();

    const listResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}`,
      {
        headers,
      },
    );

    expect(listResponse.status).toBe(200);

    const listResult = await listResponse.json();

    expect(listResult).toContainEqual({
      ...user1,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      role: "user",
    });
    expect(listResult).toContainEqual({
      ...user2,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      role: "user",
    });
  });

  it("deletes a user", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user1 = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })
    ).json();

    const user2: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: `${username}1`,
          email: "test1@email.com",
          password,
        }),
      })
    ).json();

    const deleteResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/${user2.id}`,
      {
        method: "DELETE",
        headers,
      },
    );

    expect(deleteResponse.status).toBe(200);

    const listResult = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        headers,
      })
    ).json();

    expect(listResult).toContainEqual(user1);
    expect(listResult).not.toContainEqual(user2);

    const getByEmailResponse = await SELF.fetch(
      `http://api.authabl.com/users/${clientId}/email/${
        // biome-ignore lint/style/noNonNullAssertion: Asserted in another test
        encodeURIComponent(user2.emailAddresses?.[0]!)
      }`,
      { headers },
    );

    expect(getByEmailResponse.status).toBe(404);

    const getByUsernameResponse = await SELF.fetch(
      `http://api.authabl.com/users/${clientId}/email/${user2.username}`,
      { headers },
    );

    expect(getByUsernameResponse.status).toBe(404);
  });

  it("updates a user", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })
    ).json();

    const updateResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/${user.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          username: newUsername,
          emailAddresses: [newEmail],
          password: newPassword,
        }),
      },
    );

    expect(updateResponse.status).toBe(200);

    const updateResult: User = await updateResponse.json();

    expect(updateResult).toStrictEqual({
      username: newUsername,
      emailAddresses: [newEmail],
      emailVerified: false,
      id: user.id,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      role: "user",
    });

    const getUserResult = await (
      await SELF.fetch(
        `https://api.authabl.com/users/${clientId}/id/${user.id}`,
        { headers },
      )
    ).json();

    expect(getUserResult).toStrictEqual({
      ...updateResult,
      sessions: expect.any(Number),
    });
  });

  it("updates a user with the same data without error", async () => {
    const { clientId, headers } = await bootstrapClient();

    const user: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      })
    ).json();

    const updateResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/${user.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          username,
          emailAddresses: [email],
        }),
      },
    );

    expect(updateResponse.status).toBe(200);

    const updateResult: User = await updateResponse.json();

    expect(updateResult).toStrictEqual({
      username,
      emailAddresses: [email],
      emailVerified: false,
      id: user.id,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      role: "user",
    });

    const getUserResult = await (
      await SELF.fetch(
        `https://api.authabl.com/users/${clientId}/id/${user.id}`,
        { headers },
      )
    ).json();

    expect(getUserResult).toStrictEqual({
      ...updateResult,
      sessions: expect.any(Number),
    });
  });

  it("returns 422 when updating a user with an unavailable username", async () => {
    const { clientId, headers } = await bootstrapClient();

    await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const user: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password,
        }),
      })
    ).json();

    const updateResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/${user.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          username,
        }),
      },
    );

    expect(updateResponse.status).toBe(422);
  });

  it("returns 422 when updating a user with an unavailable email", async () => {
    const { clientId, headers } = await bootstrapClient();

    await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const user: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password,
        }),
      })
    ).json();

    const updateResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/${user.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          emailAddresses: [email],
        }),
      },
    );

    expect(updateResponse.status).toBe(422);
  });

  it("returns 404 when updating a user doesn't exist", async () => {
    const { clientId, headers } = await bootstrapClient();

    await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const user: User = await (
      await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password,
        }),
      })
    ).json();

    const updateResponse = await SELF.fetch(
      `https://api.authabl.com/users/${clientId}/${user.id}1`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          emailAddresses: [newEmail],
        }),
      },
    );

    expect(updateResponse.status).toBe(404);
  });
});
