import type { Page, Route } from "@playwright/test";
import type { GraphQLHandler, RestHandler, RequestHandler } from "msw";
import {
  RegisteredHandler,
  MockServiceWorker,
  RouteHandler,
  RouteUrl,
} from "./types";
import { handleRoute } from "./handler";
import { getHandlerUrl, isRestHandler } from "./utils";

const registerRestHandler = async (
  page: Page,
  requestHandler: RestHandler
): Promise<RegisteredHandler> => {
  const routeUrl: RouteUrl = getHandlerUrl(requestHandler);
  const routeHandler: RouteHandler = async (route: Route) => {
    try {
      await handleRoute(route, requestHandler);
    } catch (error: unknown) {
      void route.abort("failed");
    }
  };

  page.route(routeUrl, routeHandler);
  return { routeUrl, routeHandler, requestHandler };
};

const registerGraphQLHandler = async (
  page: Page,
  handler: GraphQLHandler
): Promise<RegisteredHandler> => {
  console.log(page, handler);
  return Promise.reject(
    new Error("Support for GraphQL is not yet implemented.")
  );
};

const registerRequestHandler = async (
  page: Page,
  handler: RequestHandler
): Promise<RegisteredHandler> =>
  isRestHandler(handler)
    ? registerRestHandler(page, handler as RestHandler)
    : registerGraphQLHandler(page, handler as GraphQLHandler);

const registerRequestHandlers = async (
  page: Page,
  handlers: RequestHandler[]
): Promise<RegisteredHandler[]> =>
  await Promise.all(
    handlers.map((handler) => registerRequestHandler(page, handler))
  );

export const setupServer = async (
  page: Page,
  ...initialRequestHandlers: RequestHandler[]
): Promise<MockServiceWorker> => {
  // const initialRegisteredHandlers: RegisteredHandler[] =
  await registerRequestHandlers(page, initialRequestHandlers);

  /**
   * An array of handlers that were registered using `worker.use()`.
   * NOTE: the initial handlers are not included within this array.
   */
  let extraRegisteredHandlers: RegisteredHandler[] = [];

  return {
    use: async (...newRequestHandlers) => {
      const recentlyRegisteredHandlers = await registerRequestHandlers(
        page,
        newRequestHandlers
      );
      extraRegisteredHandlers = [
        ...extraRegisteredHandlers,
        ...recentlyRegisteredHandlers,
      ];
    },
    resetHandlers: async (...specificHandlers) => {
      // TODO: add support for passing in custom handlers to reset
      if (specificHandlers.length > 0) {
        throw new Error("Resetting specific handlers is not yet implemented.");
      }

      // Process in reverse order to prevent shifting indexes while iterating
      await Promise.all(
        extraRegisteredHandlers.map(({ routeUrl, routeHandler }) => {
          page.unroute(routeUrl, routeHandler);
        })
      );
      extraRegisteredHandlers = [];
    },
  };
};
