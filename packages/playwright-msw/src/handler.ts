import type { Route } from '@playwright/test';
import type { RequestHandler, LifeCycleEventsMap } from 'msw';
import { handleRequest } from 'msw';
import { Emitter } from 'strict-event-emitter';
import { uuidv4 } from './utils';

const emitter = new Emitter<LifeCycleEventsMap>();

function objectifyHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

async function readableStreamToBuffer(
  contentType: string | undefined,
  body: ReadableStream<Uint8Array> | null
): Promise<string | Buffer | undefined> {
  if (!body) return undefined;

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const { value, done: readDone } = await reader.read();
    if (value) {
      chunks.push(value);
    }
    done = readDone;
  }

  // Calculate the total length of all chunks
  const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);

  // Combine the chunks into a single Uint8Array
  const combinedChunks = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combinedChunks.set(chunk, offset);
    offset += chunk.length;
  }

  if (contentType?.includes('application/json')) {
    return new TextDecoder().decode(combinedChunks);
  } else if (contentType?.includes('text')) {
    return new TextDecoder().decode(combinedChunks);
  } else {
    // For binary data, return as Buffer
    return Buffer.from(combinedChunks);
  }
}

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
      uuidv4(),
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
      }
    );
  } catch {
    await route.abort();
  }
};
