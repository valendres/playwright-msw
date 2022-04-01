import type { Page, Route } from "@playwright/test";
import type { RequestHandler } from "msw";
import { Headers } from "headers-polyfill";
import { handleRequest, parseIsomorphicRequest } from "msw";
import EventEmitter from "events";

const emitter = new EventEmitter();

const handleRoute = async (route: Route, handlers: RequestHandler[]) => {
  const request = route.request();
  const method = request.method();
  const url = new URL(request.url());
  const headers = new Headers(await request.allHeaders());

  const mockedRequest = parseIsomorphicRequest({
    id: "",
    method,
    url,
    headers,
    credentials: "omit",
    body: request.postData() ?? undefined,
  });

  await handleRequest(
    mockedRequest,
    handlers,
    {
      onUnhandledRequest: () => {
        route.continue();
      },
    },
    emitter,
    {
      resolutionContext: {
        /**
         * @note Resolve relative request handler URLs against
         * the server's origin (no relative URLs in Node.js).
         */
        baseUrl: url.origin,
      },
      onMockedResponseSent(mockedResponse) {
        const { status, headers, body } = mockedResponse;
        route.fulfill({
          status,
          body: body ?? undefined,
          contentType: headers.get("content-type") ?? undefined,
          headers: headers.all(),
        });
      },
    }
  );
};

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

export const createServer = async (
  page: Page,
  ...originalHandlers: RequestHandler[]
): Promise<MockServiceWorker> => {
  let cachedHandlers: RequestHandler[] = originalHandlers;

  await page.route("/**", (route) => {
    try {
      void handleRoute(route, cachedHandlers);
    } catch (error: unknown) {
      void route.fulfill({
        status: 502,
        body: (error as Error).message,
      });
    }
  });

  return {
    use: async (...customHandlers) => {
      cachedHandlers = [...customHandlers, ...cachedHandlers];
    },
    resetHandlers: async (...customHandlers) => {
      cachedHandlers =
        customHandlers.length > 0 ? customHandlers : originalHandlers;
    },
  };
};
