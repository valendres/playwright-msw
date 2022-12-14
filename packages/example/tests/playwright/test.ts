import { test as base, expect } from '@playwright/test';
import { rest } from 'msw';
import type { MockServiceWorker, Config } from 'playwright-msw';
import { createWorkerFixture } from 'playwright-msw';
import handlers from '../../src/mocks/handlers';

const testFactory = (config?: Config) =>
  base.extend<{
    worker: MockServiceWorker;
    rest: typeof rest;
  }>({
    worker: createWorkerFixture(handlers, config),
    rest,
  });

const test = testFactory();

export { testFactory, test, expect };
