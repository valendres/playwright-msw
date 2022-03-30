import { createMiddleware } from "@mswjs/http-middleware";
import type { Page, Request, TestInfo } from "@playwright/test";
import { json } from "body-parser";
import express from "express";
import type { RestHandler } from "msw";
import fetch from "node-fetch";
import type { Server } from "node:http";

const rewriteBaseURL = (handler: RestHandler, baseUrl: string): RestHandler => {
  const currentMethod = handler.info.method;
  const currentPath = handler.info.path.toString();
  const newPath = currentPath.startsWith("/")
    ? `${baseUrl}${currentPath}`
    : handler.info.path.toString();
  handler.info.path = newPath;
  handler.info.header = `${currentMethod} ${newPath}`;
  return handler;
};

const handleRequest = async ({
  request,
  webServerPort,
  workerServerPort,
}: {
  request: Request;
  webServerPort: number;
  workerServerPort: number;
}): ReturnType<typeof fetch> => {
  const method = request.method();
  const url = request
    .url()
    .replace(`localhost:${webServerPort}`, `localhost:${workerServerPort}`);
  return fetch(url, {
    method,
    ...(["POST", "PATCH", "PUT"].includes(method)
      ? {
          body: request.postData() ?? "",
        }
      : {}),
    headers: {
      "content-type": "application/json",
    },
  });
};

const createWorker = (
  port: number,
  ...handlers: RestHandler[]
): MockServiceWorker => {
  let server: Server | null = null;

  const initServer = async (
    ...customHandlers: RestHandler[]
  ): Promise<void> => {
    if (server) {
      throw new Error("Worker is already listening.");
    }

    const app = express();

    app.use(json());

    const transformedHandlers = [...customHandlers, ...handlers].map(
      (handler) => rewriteBaseURL(handler, `http://localhost:${port}`)
    );

    app.use(createMiddleware(...transformedHandlers));

    await new Promise<void>((resolve) => {
      server = app.listen(port, () => {
        resolve();
      });
    });
  };

  const close = async (): Promise<void> =>
    new Promise((resolve) => {
      server?.close(() => {
        server = null;
        resolve();
      });
    });

  const use = async (...customHandlers: RestHandler[]): Promise<void> => {
    if (server) {
      await close();
    }
    await initServer(...customHandlers);
  };

  const listen = async (): Promise<void> => {
    await initServer();
  };

  return {
    port,
    listen,
    use,
    close,
  };
};

export type MockServiceWorker = {
  /** The port which the MSW server is running on. */
  port: number;
  listen: () => Promise<void>;
  use: (...customHandlers: RestHandler[]) => Promise<void>;
  close: () => Promise<void>;
};

export const createServer = async ({
  page,
  info,
  url,
  handlers,
  webServerPort,
  baseWorkerServerPort,
}: {
  page: Page;
  info: TestInfo;
  url: string;
  handlers: RestHandler[];
  webServerPort: number;
  baseWorkerServerPort: number;
}): Promise<MockServiceWorker> => {
  const workerServerPort = baseWorkerServerPort + info.parallelIndex;
  const worker = createWorker(workerServerPort, ...handlers);
  await page.route(url, (route) => {
    try {
      const request = route.request();
      void handleRequest({ request, webServerPort, workerServerPort }).then(
        async (response) =>
          route.fulfill({
            status: response.status,
            contentType: "application/json",
            body:
              response.headers.get("content-type") === "application/json"
                ? JSON.stringify(await response.json())
                : await response.text(),
          })
      );
    } catch (error: unknown) {
      void route.fulfill({
        status: 502,
        body: (error as Error).message,
      });
    }
  });

  return worker;
};
