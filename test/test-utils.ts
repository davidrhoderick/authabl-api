import { SELF } from "cloudflare:test";
import type { Client } from "../src/clients/types";

export const bootstrapClient = async () => {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  const clientResult: Client = await (
    await SELF.fetch("https://api.authabl.com/clients", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Test",
        allowedOrigins: ["http://test.com"],
        accessTokenValidity: 3600,
        refreshTokenValidity: 1209600,
        disableRefreshToken: false,
        refreshRefreshToken: true,
      }),
    })
  ).json();

  headers.set("X-AUTHABL-API-KEY", clientResult.secret);

  return { headers, clientId: clientResult.id };
};
