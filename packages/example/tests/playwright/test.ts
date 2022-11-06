import { test as base, expect } from '@playwright/test';
import { rest } from 'msw';
import type { MockServiceWorker } from 'playwright-msw';
import { createWorkerFixture } from 'playwright-msw';
import handlers from '../../src/mocks/handlers';

const test = base.extend<{
  worker: MockServiceWorker;
  rest: typeof rest;
}>({
  worker: createWorkerFixture(...handlers),
  rest,
});

export { test, expect };
