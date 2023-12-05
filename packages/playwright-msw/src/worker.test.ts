import { beforeEach, describe, it, jest, expect } from '@jest/globals';
import { mockPage } from '../mocks/playwright';
import { successResolver } from '../mocks/msw';
import { Router } from './router';
import { createWorker } from './worker';
import { http } from 'msw';

describe('worker', () => {
  beforeEach(() => {
    // Make sure each test starts fresh
    jest.restoreAllMocks();

    // Setup spies
    jest.spyOn(Router.prototype, 'start');
    jest.spyOn(Router.prototype, 'use');
    jest.spyOn(Router.prototype, 'resetHandlers');
  });

  it('should start the router with the provided initialHandlers', async () => {
    const requestHandlers = [http.get('/api/users', successResolver)];
    const page = mockPage();
    await createWorker(page, requestHandlers);
    expect(Router.prototype.start).toBeCalledTimes(1);
    expect(Router.prototype.start).toBeCalledWith();
  });

  it('should still start on the router even if no initialHandlers were provided', async () => {
    const page = mockPage();
    await createWorker(page);
    expect(Router.prototype.start).toBeCalledTimes(1);
    expect(Router.prototype.start).toBeCalledWith();
  });

  it('should proxy the "use" function to the router', async () => {
    const handlers = [
      http.get('/api/potato', successResolver),
      http.get('/api/eggplant', successResolver),
    ];
    const page = mockPage();
    const worker = await createWorker(page);
    await worker.use(...handlers);
    expect(Router.prototype.use).toBeCalledTimes(1);
    expect(Router.prototype.use).toBeCalledWith(...handlers);
  });

  it('should proxy the "resetHandlers" function to the router', async () => {
    const page = mockPage();
    const worker = await createWorker(page);
    await worker.resetHandlers();
    expect(Router.prototype.resetHandlers).toBeCalledTimes(1);
    expect(Router.prototype.resetHandlers).toBeCalledWith();
  });
});
