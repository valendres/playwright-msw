import { RequestHandler } from "msw";
import { Page, Route, Request } from "@playwright/test";

import { getHandlerUrl, getHandlerType } from "./utils";
import { handleRoute } from "./handler";

export type RouteUrl = string;

export type RouteHandler = (route: Route, request: Request) => void;

export type RouteMeta = {
  readonly routeHandler: RouteHandler;
  readonly requestHandlers: RequestHandler[];
};

export class Router {
  private page: Page;
  private initialRequestHandlers: RequestHandler[];
  private routes: Record<RouteUrl, RouteMeta> = {};
  private isStarted = false;

  public constructor(page: Page, ...initialRequestHandlers: RequestHandler[]) {
    this.page = page;
    this.initialRequestHandlers = initialRequestHandlers;
  }

  public async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error("Router can only be started once");
    }

    for (const initialHandler of this.initialRequestHandlers) {
      await this.registerMswHandler(initialHandler);
    }
    this.isStarted = true;
  }

  public async use(
    ...additionalRequestHandlers: RequestHandler[]
  ): Promise<void> {
    for (const additionalHandler of additionalRequestHandlers) {
      await this.registerMswHandler(additionalHandler);
    }
  }

  public async resetHandlers(
    ...nextRequestHandlers: RequestHandler[]
  ): Promise<void> {
    // Determine the target handlers
    const targetRestHandlers =
      nextRequestHandlers.length > 0
        ? nextRequestHandlers
        : this.initialRequestHandlers;

    // Determine the target routes
    const targetRoutes = targetRestHandlers.reduce<
      Record<RouteUrl, RequestHandler[]>
    >((accumulator, targetRestHandler) => {
      const url = getHandlerUrl(targetRestHandler);
      if (url in accumulator) {
        accumulator[url].push(targetRestHandler);
      } else {
        accumulator[url] = [targetRestHandler];
      }
      return accumulator;
    }, {});

    // Unregister routes which are no longer required
    const urlsToPurge = [...Object.keys(this.routes)].filter(
      (url) => !(url in targetRoutes)
    );
    for (const url of urlsToPurge) {
      const { [url]: _, ...remainingRoutes } = this.routes;
      await this.unregisterPlaywrightRoute(url);
      this.routes = remainingRoutes;
    }

    // Register new routes
    const urlsToRegister = [...Object.keys(targetRoutes)].filter(
      (url) => !(url in this.routes)
    );
    for (const url of urlsToRegister) {
      this.routes[url] = {
        routeHandler: await this.registerPlaywrightRoute(url),
        requestHandlers: targetRoutes[url],
      };
    }

    // Synchronize all other routes
    const urlsToSynchronize = [...Object.keys(this.routes)].filter(
      (url) => url in targetRoutes
    );
    for (const url of urlsToSynchronize) {
      this.routes[url] = {
        ...this.routes[url],
        requestHandlers: targetRoutes[url],
      };
    }
  }

  private async registerMswHandler(handler: RequestHandler): Promise<void> {
    if (getHandlerType(handler) === "graphql") {
      return Promise.reject(
        new Error("Support for GraphQL is not yet implemented.")
      );
    }

    const url = getHandlerUrl(handler);
    if (url in this.routes) {
      const existingRoute = this.routes[url];
      this.routes[url] = {
        ...existingRoute,
        requestHandlers: [...existingRoute.requestHandlers, handler],
      };
    } else {
      this.routes[url] = {
        routeHandler: await this.registerPlaywrightRoute(url),
        requestHandlers: [handler],
      };
    }
  }

  private async registerPlaywrightRoute(url: RouteUrl): Promise<RouteHandler> {
    const routeHandler: RouteHandler = (route: Route) => {
      const requestHandlers = this.routes[url]?.requestHandlers ?? [];
      handleRoute(route, requestHandlers);
    };
    await this.page.route(url, routeHandler);
    return routeHandler;
  }

  private async unregisterPlaywrightRoute(url: RouteUrl): Promise<void> {
    const route = this.routes[url];
    if (route) {
      this.page.unroute(url, route.routeHandler);
    }
  }
}
