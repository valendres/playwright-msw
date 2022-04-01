import { test as base, expect } from "@playwright/test";
import { rest } from "msw";
import type { MockServiceWorker } from "playwright-msw";
import { createServer } from "playwright-msw";
import { handlers } from "../../src/mocks/handlers";

export const test = base.extend<{
  msw: MockServiceWorker;
  rest: typeof rest;
}>({
  msw: [
    async ({ page }, use): Promise<void> => {
      const server = await createServer(page, ...handlers);
      await use(server);
    },
    {
      /**
       * Scope this fixture on a per test basis to ensure that each test has a
       * fresh copy of MSW.
       */
      scope: "test",
      /**
       * By default, fixtures are lazy; they will not be initalised unless they're
       * used by the test. Setting `true` here means that the fixture will be auto-
       * initialised even if the test doesn't use it.
       */
      auto: true,
    },
  ],
  rest,
});

export { expect };
