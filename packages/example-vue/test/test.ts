import { test as base, expect } from '@playwright/test';
import type { MockServiceWorker } from 'playwright-msw';
import { createWorkerFixture } from 'playwright-msw';

import { testHandlers } from '../src/mocks/handler';

const test = base.extend<{
  worker: MockServiceWorker;
}>({
  worker: createWorkerFixture(testHandlers),
});

export { test, expect };
