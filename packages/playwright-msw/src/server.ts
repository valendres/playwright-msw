import type { Page } from "@playwright/test";
import type { RequestHandler } from "msw";
import { MockServiceWorker } from "./types";
import { Router } from "./router";

export const setupServer = async (
  page: Page,
  ...initialRequestHandlers: RequestHandler[]
): Promise<MockServiceWorker> => {
  const router = new Router(page);
  await router.initialise(...initialRequestHandlers);
  return {
    use: async (...handlers) => router.use(...handlers),
    resetHandlers: async (...handlers) => router.resetHandlers(...handlers),
  };
};
