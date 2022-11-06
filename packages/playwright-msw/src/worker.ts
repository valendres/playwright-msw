import type { Page } from '@playwright/test';
import { store } from '@mswjs/cookies';
import type { RequestHandler } from 'msw';
import { Router } from './router';
import { Config } from './config';

export type MockServiceWorker = {
  /**
   * Prepends given request handlers to the list of existing handlers.
   */
  use: (...customHandlers: RequestHandler[]) => Promise<void>;
  /**
   * Resets request handlers to the initial list given to the createServer call,
   * or to the explicit next request handlers list, if given.
   */
  resetHandlers: (...customHandlers: RequestHandler[]) => Promise<void>;
  /**
   * Resets MSW's internal cookie store by removing all cookies from it.
   */
  resetCookieStore: () => void;
};

export const setupWorker = async (init: {
  page: Page;
  requestHandlers?: RequestHandler[];
  config?: Config;
}): Promise<MockServiceWorker> => {
  const router = new Router(init);
  await router.start();
  return {
    use: async (...handlers) => router.use(...handlers),
    resetHandlers: async (...handlers) => router.resetHandlers(...handlers),
    resetCookieStore: () => {
      store.clear();
    },
  };
};
