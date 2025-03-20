import { HTTPException } from "hono/http-exception";

expect.extend({
  toThrow401HTTPExceptionError: async (received: unknown) => {
    if (typeof received === "undefined" || !(received instanceof HTTPException))
      return {
        pass: false,
        message: () => "expected to receive HTTPException",
      };

    // @ts-ignore
    if (received.status !== 401)
      return {
        pass: false,
        message: () =>
          // @ts-ignore
          `expected to be status 401, received ${received.res.status}`,
      };

    return {
      message: () => "expected to receive 401 HTTPException error",
      pass: true,
    };
  },
});
