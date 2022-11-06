import { RequestHandler, Path } from 'msw';
import { Page, Route, Request } from '@playwright/test';

import {
  getHandlerPath,
  serializePath,
  deserializePath,
  SerializedPath,
  convertMswPathToPlaywrightUrl,
} from './utils';
import { handleRoute } from './handler';
import { Config } from './config';

export type RouteHandler = (route: Route, request: Request) => void;

export type RouteData = {
  readonly path: Path;
  readonly routeHandler: RouteHandler;
  readonly requestHandlers: RequestHandler[];
};

export class Router {
  private page: Page;
  private config: Config;
  private initialRequestHandlers: RequestHandler[];
  private routes: Record<SerializedPath, RouteData> = {};
  private isStarted = false;

  public constructor({
    config,
    page,
    requestHandlers,
  }: {
    page: Page;
    requestHandlers?: RequestHandler[];
    config?: Config;
  }) {
    this.page = page;
    this.initialRequestHandlers = requestHandlers ?? [];
    this.config = config ?? {};
  }

  public async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error('Router can only be started once');
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
      Record<SerializedPath, RequestHandler[]>
    >((accumulator, targetRestHandler) => {
      const serializedPath = serializePath(
        getHandlerPath(targetRestHandler, this.config)
      );
      if (serializedPath in accumulator) {
        accumulator[serializedPath].push(targetRestHandler);
      } else {
        accumulator[serializedPath] = [targetRestHandler];
      }
      return accumulator;
    }, {});

    // Unregister routes which are no longer required
    const serializedPathsToPurge = [...Object.keys(this.routes)].filter(
      (serializedPath) => !(serializedPath in targetRoutes)
    ) as SerializedPath[];
    for (const serializedPath of serializedPathsToPurge) {
      const { [serializedPath]: data, ...remainingRoutes } = this.routes;
      await this.unregisterPlaywrightRoute(data.path);
      this.routes = remainingRoutes;
    }

    // Register new routes
    const serializedPathsToRegister = [...Object.keys(targetRoutes)].filter(
      (serializedPath) => !(serializedPath in this.routes)
    ) as SerializedPath[];
    for (const serializedPath of serializedPathsToRegister) {
      const path = deserializePath(serializedPath);
      this.setRouteData({
        path,
        routeHandler: await this.registerPlaywrightRoute(path),
        requestHandlers: targetRoutes[serializedPath],
      });
    }

    // Synchronize all other routes
    const serializedPathsToSynchronize = [...Object.keys(this.routes)].filter(
      (serializedPath) => serializedPath in targetRoutes
    ) as SerializedPath[];
    for (const serializedPath of serializedPathsToSynchronize) {
      this.setRouteData({
        ...this.routes[serializedPath],
        requestHandlers: targetRoutes[serializedPath],
      });
    }
  }

  private async registerMswHandler(handler: RequestHandler): Promise<void> {
    const path = getHandlerPath(handler, this.config);
    const existingRouteData = this.getRouteData(path);
    if (existingRouteData) {
      this.setRouteData({
        ...existingRouteData,
        requestHandlers: [...existingRouteData.requestHandlers, handler],
      });
    } else {
      this.setRouteData({
        path,
        routeHandler: await this.registerPlaywrightRoute(path),
        requestHandlers: [handler],
      });
    }
  }

  private async registerPlaywrightRoute(path: Path): Promise<RouteHandler> {
    const routeHandler: RouteHandler = (route: Route) => {
      const requestHandlers = this.getRouteData(path)?.requestHandlers ?? [];
      handleRoute(route, requestHandlers);
    };
    await this.page.route(convertMswPathToPlaywrightUrl(path), routeHandler);
    return routeHandler;
  }

  private async unregisterPlaywrightRoute(path: Path): Promise<void> {
    const data = this.getRouteData(path);
    if (data) {
      this.page.unroute(
        convertMswPathToPlaywrightUrl(data.path),
        data.routeHandler
      );
    }
  }

  private getRouteData(path: Path): RouteData | null {
    return this.routes[serializePath(path)];
  }

  private setRouteData(data: RouteData) {
    this.routes[serializePath(data.path)] = data;
  }
}
