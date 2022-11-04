import type { Page } from "@playwright/test";
import type { RequestHandler } from "msw";
import { Router } from "./router";

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
};

export const setupWorker = async (
  page: Page,
  ...initialRequestHandlers: RequestHandler[]
): Promise<MockServiceWorker> => {
  const router = new Router(page, ...initialRequestHandlers);
  await router.start();
  return {
    use: async (...handlers) => router.use(...handlers),
    resetHandlers: async (...handlers) => router.resetHandlers(...handlers),
  };
};
