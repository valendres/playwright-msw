import { RequestHandler } from "msw";
import { Page, Route } from "@playwright/test";

import { RouteHandler } from "./types";
import { getHandlerUrl, isRestHandler } from "./utils";
import { handleRoute } from "./handler";

type RouteUrl = string;
type RouteMeta = {
  readonly routeHandler: RouteHandler;
  readonly requestHandlers: ReadonlyArray<{
    readonly handler: RequestHandler;
    readonly initial: boolean;
  }>;
};

export class Router {
  private page: Page;
  private routes: Record<RouteUrl, RouteMeta> = {};

  public constructor(page: Page) {
    this.page = page;
  }

  public async initialise(...initialHandlers: RequestHandler[]): Promise<void> {
    for (const initialHandler of initialHandlers) {
      await this.registerMswHandler(initialHandler, true);
    }
  }

  public async use(...additionalHandlers: RequestHandler[]): Promise<void> {
    for (const additionalHandler of additionalHandlers) {
      await this.registerMswHandler(additionalHandler, false);
    }
  }

  public async resetHandlers(
    ...specificHandlers: RequestHandler[]
  ): Promise<void> {
    if (specificHandlers.length > 0) {
      throw new Error("Resetting specific handlers is not yet implemented.");
    }
    for (const [url, { requestHandlers }] of Object.entries(this.routes)) {
      const extraHandlers = requestHandlers.filter(({ initial }) => !initial);
      if (requestHandlers.length === 1 && extraHandlers.length === 1) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [url]: _, ...remainingRoutes } = this.routes;
        await this.unregisterPlaywrightRoute(url);
        this.routes = remainingRoutes;
      } else if (extraHandlers.length > 0) {
        const existingRoute = this.routes[url];
        this.routes[url] = {
          ...existingRoute,
          requestHandlers: existingRoute.requestHandlers.filter(
            (requestHandler) => !extraHandlers.includes(requestHandler)
          ),
        };
      }
    }
  }

  private async registerMswHandler(
    handler: RequestHandler,
    initial: boolean
  ): Promise<void> {
    if (!isRestHandler(handler)) {
      return Promise.reject(
        new Error("Support for GraphQL is not yet implemented.")
      );
    }

    const url = getHandlerUrl(handler);
    if (url in this.routes) {
      const existingRoute = this.routes[url];
      this.routes[url] = {
        ...existingRoute,
        requestHandlers: [
          {
            handler,
            initial,
          },
          ...existingRoute.requestHandlers,
        ],
      };
    } else {
      this.routes[url] = {
        routeHandler: await this.registerPlaywrightRoute(url),
        requestHandlers: [
          {
            handler,
            initial,
          },
        ],
      };
    }
  }

  private async registerPlaywrightRoute(url: string): Promise<RouteHandler> {
    const routeHandler: RouteHandler = async (route: Route) => {
      const requestHandlers = (this.routes[url]?.requestHandlers ?? []).map(
        ({ handler }) => handler
      );
      await handleRoute(route, requestHandlers);
    };
    await this.page.route(url, routeHandler);
    return routeHandler;
  }

  private async unregisterPlaywrightRoute(url: string): Promise<void> {
    const route = this.routes[url];
    if (route) {
      this.page.unroute(url, route.routeHandler);
    }
  }
}
