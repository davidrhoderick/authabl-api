import { clientAuthenticationMiddleware } from "../src/middleware/client-authentication";
import * as tokenUtils from "../src/tokens/utils";

const getWithMetadataSpy = vi.fn();

const KV = {
  getWithMetadata: getWithMetadataSpy,
};

describe("Client Authentication Middleware", () => {
  it("calls next if matching client ID and secret", async () => {
    getWithMetadataSpy.mockImplementation(() => ({
      metadata: { secret: "clientSecret" },
    }));

    const nextSpy = vi.fn();

    await clientAuthenticationMiddleware(
      {
        env: {
          // @ts-expect-error For tests, we don't care about full type-safety
          KV,
        },
        // @ts-expect-error For tests, we don't care about full type-safety
        req: {
          param: (name: string) => (name === "clientId" ? "clientId" : ""),
          header: (name: string) =>
            name === "X-AUTHABL-API-KEY" ? "clientSecret" : undefined,
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
      clientAuthenticationMiddleware(
        {
          env: {
            // @ts-expect-error For tests, we don't care about full type-safety
            KV,
          },
          // @ts-expect-error For tests, we don't care about full type-safety
          req: {
            param: (name: string) => (name === "clientId" ? "clientId" : ""),
            header: (name: string) =>
              name === "X-AUTHABL-API-KEY" ? "clientSecret" : undefined,
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
      metadata: { secret: "clientSecret!" },
    }));

    const nextSpy = vi.fn();

    await expect(
      clientAuthenticationMiddleware(
        {
          env: {
            // @ts-expect-error For tests, we don't care about full type-safety
            KV,
          },
          // @ts-expect-error For tests, we don't care about full type-safety
          req: {
            param: (name: string) => (name === "clientId" ? "clientId" : ""),
            header: (name: string) =>
              name === "X-AUTHABL-API-KEY" ? "clientSecret" : undefined,
          } as { header: () => string | undefined },
        },
        nextSpy,
      ),
    ).rejects.toThrow401HTTPExceptionError();

    expect(nextSpy).not.toHaveBeenCalled();
  });
});
