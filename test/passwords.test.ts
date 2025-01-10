import { SELF } from "cloudflare:test";
import {
  ACCESSTOKEN_COOKIE,
  REFRESHTOKEN_COOKIE,
} from "../src/common/constants";
import type { ForgotPasswordResponse } from "../src/passwords/types";
import type { MobileTokenResponse } from "../src/tokens/types";
import type { User } from "../src/users/types";
import { bootstrapClient } from "./test-utils";
import type { Sessions } from "../src/sessions/types";

const email = "test@test.com";
const originalPassword = "Testp4ssw0rd!";
const newPassword = "Newtestpassword12345!";

const bootstrap = async () => {
  const { clientId, headers } = await bootstrapClient();

  await SELF.fetch(`https://api.authabl.com/users/${clientId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password: originalPassword,
    }),
  });

  await checkOriginalPassword({ headers, clientId });
  await checkNewPassword({ headers, clientId }, true);

  return { headers, clientId };
};

const checkOriginalPassword = async (
  { headers, clientId }: { headers: Headers; clientId: string },
  inverse?: boolean,
) => {
  const response = await SELF.fetch(
    `https://api.authabl.com/tokens/${clientId}/mobile`,
    {
      headers,
      method: "POST",
      body: JSON.stringify({
        email,
        password: originalPassword,
      }),
    },
  );

  if (inverse) expect(response.status).toBe(401);
  else {
    expect(response.status).toBe(200);

    const result: MobileTokenResponse = await response.json();

    expect(result.accessToken).toStrictEqual(expect.any(String));
    expect(result.refreshToken).toStrictEqual(expect.any(String));
  }
};

const checkNewPassword = async (
  { headers, clientId }: { headers: Headers; clientId: string },
  inverse?: boolean,
) => {
  const response = await SELF.fetch(
    `https://api.authabl.com/tokens/${clientId}/mobile`,
    {
      headers,
      method: "POST",
      body: JSON.stringify({
        email,
        password: newPassword,
      }),
    },
  );

  if (inverse) expect(response.status).toBe(401);
  else {
    expect(response.status).toBe(200);

    const result: MobileTokenResponse = await response.json();

    expect(result.accessToken).toStrictEqual(expect.any(String));
    expect(result.refreshToken).toStrictEqual(expect.any(String));
  }
};

describe("Passwords", () => {
  it("sends a code that can be used to change a user's password on mobile", async () => {
    const { headers, clientId } = await bootstrap();

    const forgotPasswordResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/forgot`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    );

    expect(forgotPasswordResponse.status).toBe(200);

    const forgotPasswordResult: ForgotPasswordResponse =
      await forgotPasswordResponse.json();

    const passwordResetResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset/mobile`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
          code: forgotPasswordResult.code,
          password: newPassword,
        }),
      },
    );

    expect(passwordResetResponse.status).toBe(200);

    const passwordResetResult: MobileTokenResponse =
      await passwordResetResponse.json();

    expect(passwordResetResult.accessToken).toStrictEqual(expect.any(String));
    expect(passwordResetResult.refreshToken).toStrictEqual(expect.any(String));

    const user: User = await (
      await SELF.fetch(
        `https://api.authabl.com/users/${clientId}/email/${email}`,
        {
          headers,
        },
      )
    ).json();

    expect(user.emailVerified).toBe(true);

    const consumePasswordResetResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset/web`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
          code: forgotPasswordResult.code,
          password: newPassword,
        }),
      },
    );

    expect(consumePasswordResetResponse.status).toBe(422);

    const sessionsResult: Sessions = await (
      await SELF.fetch(
        `https://api.authabl.com/sessions/${clientId}/${user.id}`,
        { headers },
      )
    ).json();

    expect(sessionsResult.length).toBe(1);

    await checkOriginalPassword({ headers, clientId }, true);
    await checkNewPassword({ headers, clientId });
  });

  it("sends a code that can be used to change a user's password on web", async () => {
    const { headers, clientId } = await bootstrap();

    const forgotPasswordResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/forgot`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    );

    expect(forgotPasswordResponse.status).toBe(200);

    const forgotPasswordResult: ForgotPasswordResponse =
      await forgotPasswordResponse.json();

    const passwordResetResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset/web`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
          code: forgotPasswordResult.code,
          password: newPassword,
        }),
      },
    );

    expect(passwordResetResponse.status).toBe(200);

    const cookies = passwordResetResponse.headers.get("set-cookie");

    expect(cookies).toStrictEqual(expect.any(String));
    expect(cookies).toContain(ACCESSTOKEN_COOKIE);
    expect(cookies).toContain(REFRESHTOKEN_COOKIE);

    headers.set("cookie", cookies as string);

    const validationResponse = await SELF.fetch(
      `https://api.authabl.com/tokens/${clientId}`,
      { headers },
    );

    expect(validationResponse.status).toBe(200);

    const user: User = await (
      await SELF.fetch(
        `https://api.authabl.com/users/${clientId}/email/${email}`,
        {
          headers,
        },
      )
    ).json();

    expect(user.emailVerified).toBe(true);

    const consumePasswordResetResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset/web`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
          code: forgotPasswordResult.code,
          password: newPassword,
        }),
      },
    );

    expect(consumePasswordResetResponse.status).toBe(422);

    const sessionsResult: Sessions = await (
      await SELF.fetch(
        `https://api.authabl.com/sessions/${clientId}/${user.id}`,
        { headers },
      )
    ).json();

    expect(sessionsResult.length).toBe(1);

    await checkOriginalPassword({ headers, clientId }, true);
    await checkNewPassword({ headers, clientId });
  });

  it("returns 404 if the email is incorrect", async () => {
    const { headers, clientId } = await bootstrap();

    const forgotPasswordResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/forgot`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    );

    expect(forgotPasswordResponse.status).toBe(200);

    const forgotPasswordResult: ForgotPasswordResponse =
      await forgotPasswordResponse.json();

    const passwordResetResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email: "bad@test.com",
          code: forgotPasswordResult.code,
          password: newPassword,
        }),
      },
    );

    expect(passwordResetResponse.status).toBe(404);

    await checkOriginalPassword({ headers, clientId });
    await checkNewPassword({ headers, clientId }, true);
  });

  it("returns 422 if the code is incorrect on mobile", async () => {
    const { headers, clientId } = await bootstrap();

    const forgotPasswordResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/forgot`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    );

    expect(forgotPasswordResponse.status).toBe(200);

    const forgotPasswordResult: ForgotPasswordResponse =
      await forgotPasswordResponse.json();

    const passwordResetResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset/mobile`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
          code: forgotPasswordResult.code.split("").reverse().join(""),
          password: newPassword,
        }),
      },
    );

    expect(passwordResetResponse.status).toBe(422);

    await checkOriginalPassword({ headers, clientId });
    await checkNewPassword({ headers, clientId }, true);
  });

  it("returns 422 if the code is incorrect on web", async () => {
    const { headers, clientId } = await bootstrap();

    const forgotPasswordResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/forgot`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    );

    expect(forgotPasswordResponse.status).toBe(200);

    const forgotPasswordResult: ForgotPasswordResponse =
      await forgotPasswordResponse.json();

    const passwordResetResponse = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset/web`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
          code: forgotPasswordResult.code.split("").reverse().join(""),
          password: newPassword,
        }),
      },
    );

    expect(passwordResetResponse.status).toBe(422);

    await checkOriginalPassword({ headers, clientId });
    await checkNewPassword({ headers, clientId }, true);
  });

  it("sends a new code that can be used to change a user's password if the first expires", async () => {
    const { headers, clientId } = await bootstrap();

    const forgotPasswordResponse1 = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/forgot`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    );

    expect(forgotPasswordResponse1.status).toBe(200);

    const forgotPasswordResult1: ForgotPasswordResponse =
      await forgotPasswordResponse1.json();

    const forgotPasswordResponse2 = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/forgot`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    );

    expect(forgotPasswordResponse2.status).toBe(200);

    const forgotPasswordResult2: ForgotPasswordResponse =
      await forgotPasswordResponse2.json();

    const passwordResetResponse1 = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset/mobile`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
          code: forgotPasswordResult1.code,
          password: newPassword,
        }),
      },
    );

    expect(passwordResetResponse1.status).toBe(422);

    const passwordResetResponse2 = await SELF.fetch(
      `https://api.authabl.com/passwords/${clientId}/reset/mobile`,
      {
        headers,
        method: "POST",
        body: JSON.stringify({
          email,
          code: forgotPasswordResult2.code,
          password: newPassword,
        }),
      },
    );

    expect(passwordResetResponse2.status).toBe(200);

    await checkOriginalPassword({ headers, clientId }, true);
    await checkNewPassword({ headers, clientId });
  });
});
