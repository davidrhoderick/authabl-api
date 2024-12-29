import { z } from "@hono/zod-openapi";

export type Bindings = {
  OAUTHABL: KVNamespace;
  RESEND_API_KEY: string;
  ACCESSTOKEN_SECRET: string;
  REFRESHTOKEN_SECRET: string;
};
