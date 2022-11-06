import type { PlaywrightTestArgs, TestFixture } from '@playwright/test';
import { RequestHandler } from 'msw';
import { Config } from './config';
import { setupWorker, MockServiceWorker } from './worker';

export const createWorkerFixture = (
  config: Config,
  ...requestHandlers: RequestHandler[]
): [
  TestFixture<MockServiceWorker, PlaywrightTestArgs>,
  { scope: 'test'; auto: boolean }
] => [
  async ({ page }, use) => {
    const worker = await setupWorker({ page, config, requestHandlers });
    await use(worker);
    worker.resetCookieStore();
  },
  {
    /**
     * Scope this fixture on a per test basis to ensure that each test has a
     * fresh copy of MSW. Note: the scope MUST be "test" to be able to use the
     * `page` fixture as it is not possible to access it when scoped to the
     * "worker".
     */
    scope: 'test',
    /**
     * By default, fixtures are lazy; they will not be initalised unless they're
     * used by the test. Setting `true` here means that the fixture will be auto-
     * initialised even if the test doesn't use it.
     */
    auto: true,
  },
];
