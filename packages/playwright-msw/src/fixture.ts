import { PlaywrightTestArgs, TestFixture } from "@playwright/test";
import { RequestHandler } from "msw";
import { createServer, MockServiceWorker } from "./server";

export const createWorkerFixture = (
  ...handlers: RequestHandler[]
): [
  TestFixture<MockServiceWorker, PlaywrightTestArgs>,
  { scope: "test"; auto: boolean }
] => [
  async ({ page }, use) => {
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
];
