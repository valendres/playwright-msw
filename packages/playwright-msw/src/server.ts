import type { Page, Route } from "@playwright/test";
import type { RequestHandler } from "msw";
import { Headers } from "headers-polyfill";
import { handleRequest, MockedRequest } from "msw";
import EventEmitter from "events";
import { MockServiceWorker } from "./types";

const emitter = new EventEmitter();

const handleRoute = async (route: Route, handlers: RequestHandler[]) => {
  const request = route.request();
  const method = request.method();
  const url = new URL(request.url());
  const headers = new Headers(await request.allHeaders());
  const postData = request.postData();

  const mockedRequest = new MockedRequest(url, {
    method,
    headers,
    credentials: "omit",
    body: postData ? Buffer.from(postData) : undefined,
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

export const createServer = async (
  page: Page,
  ...originalHandlers: RequestHandler[]
): Promise<MockServiceWorker> => {
  let cachedHandlers: RequestHandler[] = originalHandlers;

  await page.route("**/*", (route) => {
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
