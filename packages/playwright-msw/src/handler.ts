import type { Route } from '@playwright/test';
import type { MockedResponse, RequestHandler } from 'msw';
import { handleRequest, MockedRequest } from 'msw';
import EventEmitter from 'events';
import { wait } from './utils';

const emitter = new EventEmitter();

export const handleRoute = async (route: Route, handlers: RequestHandler[]) => {
  const request = route.request();
  const method = request.method();
  const url = new URL(request.url());
  const headers = await request.allHeaders();
  const postData = request.postData();

  const mockedRequest = new MockedRequest(url, {
    method,
    headers,
    body: postData ? Buffer.from(postData) : undefined,
  });

  const handleMockResponse = async ({
    status,
    headers,
    body,
    delay,
  }: MockedResponse) => {
    if (delay) {
      await wait(delay);
    }

    return route.fulfill({
      status,
      body: body ?? undefined,
      contentType: headers.get('content-type') ?? undefined,
      headers: headers.all(),
    });
  };

  try {
    await handleRequest(
      mockedRequest,
      // Reverse array so that handlers that were most recently appended are processed first
      handlers.slice().reverse(),
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
        onMockedResponse: handleMockResponse,
        // @ts-expect-error -- for compatibility with MSW < 0.47.1
        onMockedResponseSent: handleMockResponse,
      }
    );
  } catch {
    route.abort('error');
  }
};
