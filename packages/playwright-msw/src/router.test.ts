import { describe, it, expect, beforeEach, jest } from "@jest/globals";
jest.mock("./handler", () => ({
  handleRoute: jest.fn(),
}));

import { RouteHandler, Router, RouteUrl } from "./router";
import { handleRoute } from "./handler";
import { rest, graphql } from "msw";
import { mockPage, mockRoute, mockRequest } from "../mocks/playwright";
import { successResolver } from "../mocks/msw";
import { Page } from "@playwright/test";

const getRouteHandlerForUrl = (
  targetUrl: RouteUrl,
  page: Page
): RouteHandler | null => {
  const possibleRouteHandler = jest
    .mocked(page.route)
    .mock.calls.find(
      ([routeUrl]) => routeUrl === targetUrl
    )?.[1] as RouteHandler;
  return possibleRouteHandler ?? null;
};

describe("router", () => {
  beforeEach(() => {
    jest.mocked(handleRoute).mockReset();
  });

  describe("rest", () => {
    describe("initialisation", () => {
      it("should allow a router to be created without any handlers", async () => {
        const page = mockPage();
        const router = new Router(page);
        expect(router).toBeTruthy();
      });

      it("should register a route for each of the initial handlers", async () => {
        const initialHandlers = [
          rest.get("/profile", successResolver),
          rest.get("/friends", successResolver),
        ];
        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();
        expect(page.route).toHaveBeenCalledTimes(2);
        expect(page.route).toHaveBeenNthCalledWith(
          1,
          "/profile",
          expect.any(Function)
        );
        expect(page.route).toHaveBeenNthCalledWith(
          2,
          "/friends",
          expect.any(Function)
        );
      });

      it("should register a single route for multiple handlers with the same route, but different methods", async () => {
        const initialHandlers = [
          rest.get("/profile", successResolver),
          rest.put("/profile", successResolver),
        ];
        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();
        expect(page.route).toHaveBeenCalledTimes(1);
      });
    });

    describe("routing", () => {
      it("should include all of the corresponding initial handlers when calling handleRoute", async () => {
        const userUrl = "/user";
        const initialHandlers = [
          rest.get(userUrl, successResolver),
          rest.put(userUrl, successResolver),
        ];

        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();

        const executeRoute = getRouteHandlerForUrl(userUrl, page);
        executeRoute(mockRoute(), mockRequest());

        expect(handleRoute).toHaveBeenCalledTimes(1);
        expect(handleRoute).toHaveBeenCalledWith(
          expect.objectContaining({}),
          // Should be all of the initial handlers since we haven't added any non-user handlers
          initialHandlers
        );
      });

      it("should include all of the corresponding initial handlers and subsequently added handlers when calling handleRoute", async () => {
        const userUrl = "/user";
        const initialUserHandler = rest.get(userUrl, successResolver);
        const subsequentUserHandler = rest.get(userUrl, successResolver);

        const page = mockPage();
        const router = new Router(page, initialUserHandler);
        await router.start();
        await router.use(subsequentUserHandler);

        const executeRoute = getRouteHandlerForUrl(userUrl, page);
        executeRoute(mockRoute(), mockRequest());
        expect(handleRoute).toHaveBeenCalledWith(expect.objectContaining({}), [
          initialUserHandler,
          subsequentUserHandler,
        ]);
      });

      it("should include all of the corresponding subsequently added handlers (without having provided initial handlers) when calling handleRoute", async () => {
        const userUrl = "/user";
        const subsequentUserHandler1 = rest.get(userUrl, successResolver);
        const subsequentUserHandler2 = rest.get(userUrl, successResolver);

        const page = mockPage();
        const router = new Router(page);
        await router.start();
        await router.use(subsequentUserHandler1, subsequentUserHandler2);

        const executeRoute = getRouteHandlerForUrl(userUrl, page);
        executeRoute(mockRoute(), mockRequest());
        expect(handleRoute).toHaveBeenCalledWith(expect.objectContaining({}), [
          subsequentUserHandler1,
          subsequentUserHandler2,
        ]);
      });

      it("should not include handlers from other routes when calling handleRoute", async () => {
        const userUrl = "/user";
        const userHandlers = [
          rest.get(userUrl, successResolver),
          rest.put(userUrl, successResolver),
        ];
        const friendUrl = "/friend";
        const friendHandlers = [
          rest.get(friendUrl, successResolver),
          rest.patch(friendUrl, successResolver),
        ];
        const initialHandlers = [...userHandlers, ...friendHandlers];

        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();

        const executeRoute = getRouteHandlerForUrl(userUrl, page);
        executeRoute(mockRoute(), mockRequest());

        expect(handleRoute).toHaveBeenCalledTimes(1);
        expect(handleRoute).toHaveBeenCalledWith(
          expect.objectContaining({}),
          // Note the omission of friend handlers
          userHandlers
        );
      });

      it("should not include handlers from subsequently added handlers that were reset", async () => {
        const userUrl = "/user";
        const initialUserHandler1 = rest.get(userUrl, successResolver);
        const initialUserHandler2 = rest.get(userUrl, successResolver);
        const subsequentUserHandler1 = rest.get(userUrl, successResolver);
        const subsequentUserHandler2 = rest.get(userUrl, successResolver);

        const page = mockPage();
        const router = new Router(
          page,
          initialUserHandler1,
          initialUserHandler2
        );
        await router.start();
        await router.use(subsequentUserHandler1, subsequentUserHandler2);
        await router.resetHandlers();

        const executeRoute = getRouteHandlerForUrl(userUrl, page);
        executeRoute(mockRoute(), mockRequest());

        expect(handleRoute).toHaveBeenCalledTimes(1);
        expect(handleRoute).toHaveBeenCalledWith(
          expect.objectContaining({}),
          // Note the omission of subsequently added handlers
          [initialUserHandler1, initialUserHandler2]
        );
      });
    });

    describe("resetHandlers", () => {
      it("should not attempt to unroute at all if there are no initial handlers or custom handlers", async () => {
        const page = mockPage();
        const router = new Router(page);
        await router.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      it("should not attempt to unroute at all if there are initial handlers, but no custom handlers", async () => {
        const initialHandlers = [
          rest.get("/profile", successResolver),
          rest.get("/friends", successResolver),
        ];
        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();
        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      it("should not attempt to unroute the initial handlers when resetting", async () => {
        const initialHandlers = [
          rest.get("/profile", successResolver),
          rest.get("/friends", successResolver),
        ];
        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();

        await router.use(rest.get("/potato", successResolver));

        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          "/potato",
          expect.any(Function)
        );
      });

      it("should not attempt to unroute if the extra handler matches one of the initial handlers", async () => {
        const initialHandlers = [
          rest.get("/profile", successResolver),
          rest.get("/friends", successResolver),
        ];
        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();

        await router.use(rest.get("/profile", successResolver));

        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      it("should call unroute for all custom handlers, even if there were no initial handlers when router was created", async () => {
        const page = mockPage();
        const router = new Router(page);

        await router.use(rest.get("/goat", successResolver));
        await router.use(rest.get("/camel", successResolver));

        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(2);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          "/goat",
          expect.any(Function)
        );
        expect(page.unroute).toHaveBeenNthCalledWith(
          2,
          "/camel",
          expect.any(Function)
        );
      });

      it("should allow resetHandlers to be called multiple times without adding any new handlers in between", async () => {
        const page = mockPage();
        const router = new Router(page);

        await router.use(rest.get("/apple", successResolver));

        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          "/apple",
          expect.any(Function)
        );

        await router.resetHandlers();
        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(1);
      });

      it("should call unroute for newer handlers if additional handlers are added after having previously reset", async () => {
        const page = mockPage();
        const router = new Router(page);

        // First handler
        await router.use(rest.get("/car", successResolver));
        await router.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          "/car",
          expect.any(Function)
        );

        // Second handler
        await router.use(rest.get("/plane", successResolver));
        await router.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(2);
        expect(page.unroute).toHaveBeenNthCalledWith(
          2,
          "/plane",
          expect.any(Function)
        );
      });

      it("should call unroute for urls which are no longer needed when resetting to a specific set of handlers", async () => {
        const profileUrl = "/profile";
        const settingsUrl = "/settings";
        const initialHandlers = [
          rest.get(profileUrl, successResolver),
          rest.get(settingsUrl, successResolver),
        ];
        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();

        // Snapshot this before resetting mocks
        const settingsRouteHandler = getRouteHandlerForUrl(settingsUrl, page);

        // Reset call counts so it's easier to assert what happens when resetting
        jest.mocked(page.route).mockReset();
        jest.mocked(page.unroute).mockReset();

        await router.resetHandlers(
          // URL that was present in initial handlers
          rest.get(profileUrl, successResolver)
          // Note the omission of `settingsUrl` here
        );

        // Should have only unrouted settings
        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenCalledWith(
          settingsUrl,
          settingsRouteHandler
        );

        // Should not have added any additional routes
        expect(page.route).toHaveBeenCalledTimes(0);
      });

      it("should call route for urls which are now required when resetting to a specific set of handlers", async () => {
        const profileUrl = "/profile";
        const settingsUrl = "/settings";
        const initialHandlers = [
          rest.get(profileUrl, successResolver),
          // Note the omission of `settingsUrl` here
        ];
        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();

        // Reset call counts so it's easier to assert what happens when resetting
        jest.mocked(page.route).mockReset();
        jest.mocked(page.unroute).mockReset();

        await router.resetHandlers(
          rest.get(profileUrl, successResolver),
          rest.get(settingsUrl, successResolver)
        );

        // Should not have unrouted anything
        expect(page.unroute).toHaveBeenCalledTimes(0);

        // Should have added a route for settings
        expect(page.route).toHaveBeenCalledTimes(1);
        expect(page.route).toHaveBeenCalledWith(
          settingsUrl,
          getRouteHandlerForUrl(settingsUrl, page)
        );
      });

      it("should not call route or unroute if all the urls already exist when resetting to a specific set of handlers", async () => {
        const profileUrl = "/profile";
        const settingsUrl = "/settings";
        const initialHandlers = [
          rest.get(profileUrl, successResolver),
          rest.delete(profileUrl, successResolver),
          rest.get(settingsUrl, successResolver),
          rest.patch(settingsUrl, successResolver),
        ];
        const page = mockPage();
        const router = new Router(page, ...initialHandlers);
        await router.start();

        // Reset call counts so it's easier to assert what happens when resetting
        jest.mocked(page.route).mockReset();
        jest.mocked(page.unroute).mockReset();

        await router.resetHandlers(
          rest.get(profileUrl, successResolver),
          rest.get(settingsUrl, successResolver)
        );

        expect(page.unroute).toHaveBeenCalledTimes(0);
        expect(page.route).toHaveBeenCalledTimes(0);
      });

      it("should call route for all urls when resetting to a specific set of handlers after having not previously initialised with any handlers", async () => {
        const profileUrl = "/profile";
        const settingsUrl = "/settings";
        const page = mockPage();
        const router = new Router(page);
        await router.start();

        // Reset call counts so it's easier to assert what happens when resetting
        jest.mocked(page.route).mockReset();
        jest.mocked(page.unroute).mockReset();

        await router.resetHandlers(
          rest.get(profileUrl, successResolver),
          rest.get(settingsUrl, successResolver)
        );

        // Should not have unrouted anything
        expect(page.unroute).toHaveBeenCalledTimes(0);

        // Should have added a route for profile and settings
        expect(page.route).toHaveBeenCalledTimes(2);
        expect(page.route).toHaveBeenCalledWith(
          profileUrl,
          getRouteHandlerForUrl(profileUrl, page)
        );
        expect(page.route).toHaveBeenCalledWith(
          settingsUrl,
          getRouteHandlerForUrl(settingsUrl, page)
        );
      });
    });
  });

  describe("graphql", () => {
    describe("initialisation", () => {
      it('should throw a "Not Yet Implemented" error if creating a router with GraphQL handlers', async () => {
        const handlers = [graphql.query("GetUsers", successResolver)];
        const page = mockPage();
        const router = new Router(page, ...handlers);
        await expect(() => router.start()).rejects.toEqual(
          new Error("Support for GraphQL is not yet implemented.")
        );
      });
    });

    describe("extending", () => {
      it('should throw a "Not Yet Implemented" error if attempting to add GraphQL handler at later point in time', async () => {
        const handlers = [graphql.query("GetUsers", successResolver)];
        const page = mockPage();
        const router = new Router(page);
        await expect(() => router.use(...handlers)).rejects.toEqual(
          new Error("Support for GraphQL is not yet implemented.")
        );
      });
    });
  });
});
