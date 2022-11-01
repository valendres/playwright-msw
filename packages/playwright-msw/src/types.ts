import { RequestHandler } from "msw";
import type { Route } from "@playwright/test";

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

export type RouteUrl = string | RegExp;

export type RouteHandler = (route: Route) => Promise<void>;

export type RegisteredHandler = {
  /** The URL that will trigger the execution of the corresponding `routeHandler`. */
  routeUrl: RouteUrl;
  /** The route handler that is executed when a matching URL is found. */
  routeHandler: RouteHandler;
  /** The original MSW request handler. */
  requestHandler: RequestHandler;
};
