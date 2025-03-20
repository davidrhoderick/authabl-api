import { env } from "cloudflare:test";
import { superadminAuthenticationMiddleware } from "../src/middleware/superadmin-authentication";
import * as tokenUtils from "../src/tokens/utils";
import type { Bindings } from "../src/common/types";

const getWithMetadataSpy = vi.fn();

const KV = {
  getWithMetadata: getWithMetadataSpy,
};

describe("Superadmin Authentication Middleware", () => {
  it("calls next if a superadmin", async () => {
    vi.spyOn(tokenUtils, "detectAccessToken").mockImplementation(async () =>
      Promise.resolve({
        userId: "123456",
        clientId: "authabl",
        createdAt: 123456,
        expiresAt: 1234567,
        sessionId: "sessionId",
        role: "superadmin",
      }),
    );

    getWithMetadataSpy.mockImplementation(() => ({
      metadata: { secret: (env as Bindings).AUTHABL_CLIENT_SECRET },
    }));

    const nextSpy = vi.fn();

    await superadminAuthenticationMiddleware(
      {
        env: {
          // @ts-expect-error For tests, we don't care about full type-safety
          KV,
        },
        // @ts-expect-error For tests, we don't care about full type-safety
        req: {
          header: (name: string) =>
            name === "X-AUTHABL-API-KEY"
              ? (env as Bindings).AUTHABL_CLIENT_SECRET
              : undefined,
        } as { header: () => string | undefined },
      },
      nextSpy,
    );

    expect(nextSpy).toHaveBeenCalled();
  });

  it("returns 401 if no client found", async () => {
    vi.spyOn(tokenUtils, "detectAccessToken").mockImplementation(async () =>
      Promise.resolve({
        userId: "123456",
        clientId: "authabl",
        createdAt: 123456,
        expiresAt: 1234567,
        sessionId: "sessionId",
        role: "superadmin",
      }),
    );

    getWithMetadataSpy.mockImplementation(() => ({ value: null }));

    const nextSpy = vi.fn();

    expect(
      superadminAuthenticationMiddleware(
        {
          env: {
            // @ts-expect-error For tests, we don't care about full type-safety
            KV,
          },
          // @ts-expect-error For tests, we don't care about full type-safety
          req: {
            header: (name: string) =>
              name === "X-AUTHABL-API-KEY"
                ? (env as Bindings).AUTHABL_CLIENT_SECRET
                : undefined,
          } as { header: () => string | undefined },
        },
        nextSpy,
      ),
    ).rejects.toThrow401HTTPExceptionError();

    expect(nextSpy).not.toHaveBeenCalled();
  });

  it("returns 401 if bad secret token", async () => {
    vi.spyOn(tokenUtils, "detectAccessToken").mockImplementation(async () =>
      Promise.resolve({
        userId: "123456",
        clientId: "authabl",
        createdAt: 123456,
        expiresAt: 1234567,
        sessionId: "sessionId",
        role: "superadmin",
      }),
    );

    getWithMetadataSpy.mockImplementation(() => ({
      metadata: { secret: `${(env as Bindings).AUTHABL_CLIENT_SECRET}!` },
    }));

    const nextSpy = vi.fn();

    await expect(
      superadminAuthenticationMiddleware(
        {
          env: {
            // @ts-expect-error For tests, we don't care about full type-safety
            KV,
          },
          // @ts-expect-error For tests, we don't care about full type-safety
          req: {
            header: (name: string) =>
              name === "X-AUTHABL-API-KEY"
                ? (env as Bindings).AUTHABL_CLIENT_SECRET
                : undefined,
          } as { header: () => string | undefined },
        },
        nextSpy,
      ),
    ).rejects.toThrow401HTTPExceptionError();

    expect(nextSpy).not.toHaveBeenCalled();
  });

  it("returns 401 if not a superadmin", async () => {
    vi.spyOn(tokenUtils, "detectAccessToken").mockImplementation(async () =>
      Promise.resolve({
        userId: "123456",
        clientId: "authabl",
        createdAt: 123456,
        expiresAt: 1234567,
        sessionId: "sessionId",
        role: "clientadmin",
      }),
    );

    getWithMetadataSpy.mockImplementation(() => ({
      metadata: { secret: (env as Bindings).AUTHABL_CLIENT_SECRET },
    }));

    const nextSpy = vi.fn();

    await expect(
      superadminAuthenticationMiddleware(
        {
          env: {
            // @ts-expect-error For tests, we don't care about full type-safety
            KV,
          },
          // @ts-expect-error For tests, we don't care about full type-safety
          req: {
            header: (name: string) =>
              name === "X-AUTHABL-API-KEY"
                ? (env as Bindings).AUTHABL_CLIENT_SECRET
                : undefined,
          } as { header: () => string | undefined },
        },
        nextSpy,
      ),
    ).rejects.toThrow401HTTPExceptionError();

    expect(nextSpy).not.toHaveBeenCalled();
  });
});
