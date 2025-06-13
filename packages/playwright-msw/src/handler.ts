import type { Route } from '@playwright/test';
import { randomUUID } from 'crypto';
import type { RequestHandler, LifeCycleEventsMap } from 'msw';
import { handleRequest } from 'msw';
import { Emitter } from 'strict-event-emitter';
import { objectifyHeaders, readableStreamToBuffer } from './utils.js';

const emitter = new Emitter<LifeCycleEventsMap>();

export const handleRoute = async (route: Route, handlers: RequestHandler[]) => {
  const request = route.request();
  const method = request.method();
  const url = new URL(request.url());
  const headers = await request.allHeaders();
  const postData = request.postData();

  try {
    await handleRequest(
      new Request(url, {
        method,
        headers,
        body: postData ? Buffer.from(postData) : undefined,
      }),
      randomUUID(),
      // Reverse array so that handlers that were most recently appended are processed first
      handlers.slice().reverse(),
      {
        onUnhandledRequest: () => route.continue(),
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
        onMockedResponse: async ({
          status,
          headers: rawHeaders,
          body: rawBody,
        }) => {
          const contentType = rawHeaders.get('content-type') ?? undefined;
          const headers = objectifyHeaders(rawHeaders);
          const body = await readableStreamToBuffer(contentType, rawBody);

          return route.fulfill({
            status,
            body,
            contentType,
            headers,
          });
        },
      },
    );
  } catch {
    await route.abort();
  }
};
