import { Page } from "@playwright/test";
import { describe, jest, it, expect } from "@jest/globals";
import { RouteUrl, RouteHandler } from "./types";
import { setupServer } from "./server";
import { rest, graphql, ResponseResolver } from "msw";

const successResolver: ResponseResolver = (_, response, context) =>
  response(context.status(200));

const mockPage = (overrides: Partial<Page> = {}): Page => {
  const page: Partial<Page> = {
    route: jest
      .fn<(url: RouteUrl, handler: RouteHandler) => Promise<void>>()
      .mockResolvedValue(undefined),
    unroute: jest
      .fn<(url: RouteUrl, handler: RouteHandler) => Promise<void>>()
      .mockResolvedValue(undefined),
    ...overrides,
  };
  return page as Page;
};

describe("server", () => {
  describe("rest", () => {
    describe("initialise", () => {
      it("should allow a server to be created without any handlers", async () => {
        const page = mockPage();
        const server = await setupServer(page);
        expect(server).toBeTruthy();
      });

      it("should register a route for each of the initial handlers", async () => {
        const initialHandlers = [
          rest.get("/profile", successResolver),
          rest.get("/friends", successResolver),
        ];
        const page = mockPage();
        await setupServer(page, ...initialHandlers);
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
        await setupServer(page, ...initialHandlers);
        expect(page.route).toHaveBeenCalledTimes(1);
      });
    });

    describe("resetHandlers", () => {
      it("should not attempt to unroute at all if there are no initial handlers or custom handlers", async () => {
        const page = mockPage();
        const server = await setupServer(page);
        await server.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      it("should not attempt to unroute at all if there are initial handlers, but no custom handlers", async () => {
        const initialHandlers = [
          rest.get("/profile", successResolver),
          rest.get("/friends", successResolver),
        ];
        const page = mockPage();
        const server = await setupServer(page, ...initialHandlers);

        await server.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      it("should not attempt to unroute the initial handlers when resetting", async () => {
        const initialHandlers = [
          rest.get("/profile", successResolver),
          rest.get("/friends", successResolver),
        ];
        const page = mockPage();
        const server = await setupServer(page, ...initialHandlers);

        await server.use(rest.get("/potato", successResolver));

        await server.resetHandlers();

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
        const server = await setupServer(page, ...initialHandlers);

        await server.use(rest.get("/profile", successResolver));

        await server.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      it("should call unroute for all custom handlers, even if there were no initial handlers when server was created", async () => {
        const page = mockPage();
        const server = await setupServer(page);

        await server.use(rest.get("/goat", successResolver));
        await server.use(rest.get("/camel", successResolver));

        await server.resetHandlers();

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
        const server = await setupServer(page);

        await server.use(rest.get("/apple", successResolver));

        await server.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          "/apple",
          expect.any(Function)
        );

        await server.resetHandlers();
        await server.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(1);
      });

      it("should call unroute for newer handlers if additional handlers are added after having previously reset", async () => {
        const page = mockPage();
        const server = await setupServer(page);

        // First handler
        await server.use(rest.get("/car", successResolver));
        await server.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          "/car",
          expect.any(Function)
        );

        // Second handler
        await server.use(rest.get("/plane", successResolver));
        await server.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(2);
        expect(page.unroute).toHaveBeenNthCalledWith(
          2,
          "/plane",
          expect.any(Function)
        );
      });
    });
  });

  describe("graphql", () => {
    describe("initialisation", () => {
      it('should throw a "Not Yet Implemented" error if creating a server with GraphQL handlers', async () => {
        const handlers = [graphql.query("GetUsers", successResolver)];
        const page = mockPage();
        await expect(() => setupServer(page, ...handlers)).rejects.toEqual(
          new Error("Support for GraphQL is not yet implemented.")
        );
      });
    });

    describe("extending", () => {
      it('should throw a "Not Yet Implemented" error if attempting to add GraphQL handler at later point in time', async () => {
        const handlers = [graphql.query("GetUsers", successResolver)];
        const page = mockPage();
        const server = await setupServer(page);
        await expect(() => server.use(...handlers)).rejects.toEqual(
          new Error("Support for GraphQL is not yet implemented.")
        );
      });
    });
  });
});
