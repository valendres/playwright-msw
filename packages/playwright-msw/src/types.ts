import { RequestHandler } from "msw";

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
