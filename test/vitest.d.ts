interface CustomMatchers<R = unknown> {
  toThrow401HTTPExceptionError: () => R;
}

declare module "vitest" {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
