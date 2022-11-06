import { describe, test, expect, beforeEach, jest } from '@jest/globals';
jest.mock('./handler', () => ({
  handleRoute: jest.fn(),
}));

import { RouteHandler, Router } from './router';
import { handleRoute } from './handler';
import { rest, graphql, Path } from 'msw';
import { mockPage, mockRoute, mockRequest } from '../mocks/playwright';
import { successResolver } from '../mocks/msw';
import { Page } from '@playwright/test';
import { Config } from './config';

const getRouteHandlerForPath = (
  targetPath: Path,
  page: Page
): RouteHandler | null => {
  const possibleRouteHandler = jest
    .mocked(page.route)
    .mock.calls.find(
      ([routePath]) => routePath === targetPath
    )?.[1] as RouteHandler;
  return possibleRouteHandler ?? null;
};

describe('router', () => {
  beforeEach(() => {
    jest.mocked(handleRoute).mockReset();
  });

  describe('rest', () => {
    describe('initialisation', () => {
      test('should allow a router to be created without any handlers', async () => {
        const page = mockPage();
        const router = new Router({ page });
        expect(router).toBeTruthy();
      });

      test('should register a route for each of the initial handlers', async () => {
        const requestHandlers = [
          rest.get('/profile', successResolver),
          rest.get('/friends', successResolver),
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();
        expect(page.route).toHaveBeenCalledTimes(2);
        expect(page.route).toHaveBeenNthCalledWith(
          1,
          '/profile',
          expect.any(Function)
        );
        expect(page.route).toHaveBeenNthCalledWith(
          2,
          '/friends',
          expect.any(Function)
        );
      });

      test('should register a single route for multiple handlers with the same route, but different methods', async () => {
        const requestHandlers = [
          rest.get('/profile', successResolver),
          rest.put('/profile', successResolver),
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();
        expect(page.route).toHaveBeenCalledTimes(1);
      });
    });

    describe('routing', () => {
      test('should include all of the corresponding initial handlers when calling handleRoute', async () => {
        const userPath = '/user';
        const requestHandlers = [
          rest.get(userPath, successResolver),
          rest.put(userPath, successResolver),
        ];

        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();

        const executeRoute = getRouteHandlerForPath(userPath, page);
        executeRoute(mockRoute(), mockRequest());

        expect(handleRoute).toHaveBeenCalledTimes(1);
        expect(handleRoute).toHaveBeenCalledWith(
          expect.objectContaining({}),
          // Should be all of the initial handlers since we haven't added any non-user handlers
          requestHandlers
        );
      });

      test('should include all of the corresponding initial handlers and subsequently added handlers when calling handleRoute', async () => {
        const userPath = '/user';
        const initialUserHandler = rest.get(userPath, successResolver);
        const subsequentUserHandler = rest.get(userPath, successResolver);

        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers: [initialUserHandler],
        });
        await router.start();
        await router.use(subsequentUserHandler);

        const executeRoute = getRouteHandlerForPath(userPath, page);
        executeRoute(mockRoute(), mockRequest());
        expect(handleRoute).toHaveBeenCalledWith(expect.objectContaining({}), [
          initialUserHandler,
          subsequentUserHandler,
        ]);
      });

      test('should include all of the corresponding subsequently added handlers (without having provided initial handlers) when calling handleRoute', async () => {
        const userPath = '/user';
        const subsequentUserHandler1 = rest.get(userPath, successResolver);
        const subsequentUserHandler2 = rest.get(userPath, successResolver);

        const page = mockPage();
        const router = new Router({ page });
        await router.start();
        await router.use(subsequentUserHandler1, subsequentUserHandler2);

        const executeRoute = getRouteHandlerForPath(userPath, page);
        executeRoute(mockRoute(), mockRequest());
        expect(handleRoute).toHaveBeenCalledWith(expect.objectContaining({}), [
          subsequentUserHandler1,
          subsequentUserHandler2,
        ]);
      });

      test('should not include handlers from other routes when calling handleRoute', async () => {
        const userPath = '/user';
        const userHandlers = [
          rest.get(userPath, successResolver),
          rest.put(userPath, successResolver),
        ];
        const friendPath = '/friend';
        const friendHandlers = [
          rest.get(friendPath, successResolver),
          rest.patch(friendPath, successResolver),
        ];
        const requestHandlers = [...userHandlers, ...friendHandlers];

        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();

        const executeRoute = getRouteHandlerForPath(userPath, page);
        executeRoute(mockRoute(), mockRequest());

        expect(handleRoute).toHaveBeenCalledTimes(1);
        expect(handleRoute).toHaveBeenCalledWith(
          expect.objectContaining({}),
          // Note the omission of friend handlers
          userHandlers
        );
      });

      test('should not include handlers from subsequently added handlers that were reset', async () => {
        const userPath = '/user';
        const initialUserHandler1 = rest.get(userPath, successResolver);
        const initialUserHandler2 = rest.get(userPath, successResolver);
        const subsequentUserHandler1 = rest.get(userPath, successResolver);
        const subsequentUserHandler2 = rest.get(userPath, successResolver);

        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers: [initialUserHandler1, initialUserHandler2],
        });
        await router.start();
        await router.use(subsequentUserHandler1, subsequentUserHandler2);
        await router.resetHandlers();

        const executeRoute = getRouteHandlerForPath(userPath, page);
        executeRoute(mockRoute(), mockRequest());

        expect(handleRoute).toHaveBeenCalledTimes(1);
        expect(handleRoute).toHaveBeenCalledWith(
          expect.objectContaining({}),
          // Note the omission of subsequently added handlers
          [initialUserHandler1, initialUserHandler2]
        );
      });
    });

    describe('resetHandlers', () => {
      test('should not attempt to unroute at all if there are no initial handlers or custom handlers', async () => {
        const page = mockPage();
        const router = new Router({ page });
        await router.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      test('should not attempt to unroute at all if there are initial handlers, but no custom handlers', async () => {
        const requestHandlers = [
          rest.get('/profile', successResolver),
          rest.get('/friends', successResolver),
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();
        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      test('should not attempt to unroute the initial handlers when resetting', async () => {
        const requestHandlers = [
          rest.get('/profile', successResolver),
          rest.get('/friends', successResolver),
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();

        await router.use(rest.get('/potato', successResolver));

        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          '/potato',
          expect.any(Function)
        );
      });

      test('should not attempt to unroute if the extra handler matches one of the initial handlers', async () => {
        const requestHandlers = [
          rest.get('/profile', successResolver),
          rest.get('/friends', successResolver),
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();

        await router.use(rest.get('/profile', successResolver));

        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(0);
      });

      test('should call unroute for all custom handlers, even if there were no initial handlers when router was created', async () => {
        const page = mockPage();
        const router = new Router({ page });

        await router.use(rest.get('/goat', successResolver));
        await router.use(rest.get('/camel', successResolver));

        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(2);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          '/goat',
          expect.any(Function)
        );
        expect(page.unroute).toHaveBeenNthCalledWith(
          2,
          '/camel',
          expect.any(Function)
        );
      });

      test('should allow resetHandlers to be called multiple times without adding any new handlers in between', async () => {
        const page = mockPage();
        const router = new Router({ page });

        await router.use(rest.get('/apple', successResolver));

        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          '/apple',
          expect.any(Function)
        );

        await router.resetHandlers();
        await router.resetHandlers();

        expect(page.unroute).toHaveBeenCalledTimes(1);
      });

      test('should call unroute for newer handlers if additional handlers are added after having previously reset', async () => {
        const page = mockPage();
        const router = new Router({ page });

        // First handler
        await router.use(rest.get('/car', successResolver));
        await router.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenNthCalledWith(
          1,
          '/car',
          expect.any(Function)
        );

        // Second handler
        await router.use(rest.get('/plane', successResolver));
        await router.resetHandlers();
        expect(page.unroute).toHaveBeenCalledTimes(2);
        expect(page.unroute).toHaveBeenNthCalledWith(
          2,
          '/plane',
          expect.any(Function)
        );
      });

      test('should call unroute for paths which are no longer needed when resetting to a specific set of handlers', async () => {
        const profilePath = '/profile';
        const settingsPath = '/settings';
        const requestHandlers = [
          rest.get(profilePath, successResolver),
          rest.get(settingsPath, successResolver),
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();

        // Snapshot this before resetting mocks
        const settingsRouteHandler = getRouteHandlerForPath(settingsPath, page);

        // Reset call counts so it's easier to assert what happens when resetting
        jest.mocked(page.route).mockReset();
        jest.mocked(page.unroute).mockReset();

        await router.resetHandlers(
          // URL that was present in initial handlers
          rest.get(profilePath, successResolver)
          // Note the omission of `settingsPath` here
        );

        // Should have only unrouted settings
        expect(page.unroute).toHaveBeenCalledTimes(1);
        expect(page.unroute).toHaveBeenCalledWith(
          settingsPath,
          settingsRouteHandler
        );

        // Should not have added any additional routes
        expect(page.route).toHaveBeenCalledTimes(0);
      });

      test('should call route for paths which are now required when resetting to a specific set of handlers', async () => {
        const profilePath = '/profile';
        const settingsPath = '/settings';
        const requestHandlers = [
          rest.get(profilePath, successResolver),
          // Note the omission of `settingsPath` here
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();

        // Reset call counts so it's easier to assert what happens when resetting
        jest.mocked(page.route).mockReset();
        jest.mocked(page.unroute).mockReset();

        await router.resetHandlers(
          rest.get(profilePath, successResolver),
          rest.get(settingsPath, successResolver)
        );

        // Should not have unrouted anything
        expect(page.unroute).toHaveBeenCalledTimes(0);

        // Should have added a route for settings
        expect(page.route).toHaveBeenCalledTimes(1);
        expect(page.route).toHaveBeenCalledWith(
          settingsPath,
          getRouteHandlerForPath(settingsPath, page)
        );
      });

      test('should not call route or unroute if all the paths already exist when resetting to a specific set of handlers', async () => {
        const profilePath = '/profile';
        const settingsPath = '/settings';
        const requestHandlers = [
          rest.get(profilePath, successResolver),
          rest.delete(profilePath, successResolver),
          rest.get(settingsPath, successResolver),
          rest.patch(settingsPath, successResolver),
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
        });
        await router.start();

        // Reset call counts so it's easier to assert what happens when resetting
        jest.mocked(page.route).mockReset();
        jest.mocked(page.unroute).mockReset();

        await router.resetHandlers(
          rest.get(profilePath, successResolver),
          rest.get(settingsPath, successResolver)
        );

        expect(page.unroute).toHaveBeenCalledTimes(0);
        expect(page.route).toHaveBeenCalledTimes(0);
      });

      test('should call route for all paths when resetting to a specific set of handlers after having not previously initialised with any handlers', async () => {
        const profilePath = '/profile';
        const settingsPath = '/settings';
        const page = mockPage();
        const router = new Router({ page });
        await router.start();

        // Reset call counts so it's easier to assert what happens when resetting
        jest.mocked(page.route).mockReset();
        jest.mocked(page.unroute).mockReset();

        await router.resetHandlers(
          rest.get(profilePath, successResolver),
          rest.get(settingsPath, successResolver)
        );

        // Should not have unrouted anything
        expect(page.unroute).toHaveBeenCalledTimes(0);

        // Should have added a route for profile and settings
        expect(page.route).toHaveBeenCalledTimes(2);
        expect(page.route).toHaveBeenCalledWith(
          profilePath,
          getRouteHandlerForPath(profilePath, page)
        );
        expect(page.route).toHaveBeenCalledWith(
          settingsPath,
          getRouteHandlerForPath(settingsPath, page)
        );
      });
    });
  });

  describe('graphql', () => {
    const config: Config = { graphqlUrl: '/graphql' };

    describe('initialisation', () => {
      test('should throw an error when adding GraphQL handlers during initialisation if the graphqlUrl was falsy', async () => {
        const requestHandlers = [graphql.query('GetUsers', successResolver)];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
          config: {
            graphqlUrl: null,
          },
        });
        await expect(() => router.start()).rejects.toMatchObject({
          message: /Missing "graphqlUrl"/,
        });
      });

      test('should not throw an error when adding GraphQL handlers during initialisation if a explicit graphqlUrl was provided', async () => {
        const requestHandlers = [graphql.query('GetUsers', successResolver)];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
          config,
        });
        expect.assertions(1);
        const result = await router.start();
        expect(result).toBeUndefined();
      });

      test('should register a single route using the provided graphQL url if a GraphQL handler is provided', async () => {
        const requestHandlers = [graphql.query('GetUsers', successResolver)];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
          config: { graphqlUrl: '/graphql' },
        });
        await router.start();
        expect(page.route).toHaveBeenCalledTimes(1);
        expect(page.route).toHaveBeenCalledWith(
          '/graphql',
          expect.any(Function)
        );
      });

      test('should register a single route using the provided graphQL url if multiple GraphQL handlers are provided', async () => {
        const requestHandlers = [
          graphql.query('GetUsers', successResolver),
          graphql.query('GetSettings', successResolver),
          graphql.mutation('UpdateSettings', successResolver),
        ];
        const page = mockPage();
        const router = new Router({
          page,
          requestHandlers,
          config: { graphqlUrl: '/graphql' },
        });
        await router.start();
        expect(page.route).toHaveBeenCalledTimes(1);
        expect(page.route).toHaveBeenCalledWith(
          '/graphql',
          expect.any(Function)
        );
      });

      test('should utilise the default graphqlUrl for initial GraphQL handlers if one was not provided during initialisation', async () => {
        const requestHandlers = [graphql.query('GetUsers', successResolver)];
        const page = mockPage();
        const router = new Router({ page, requestHandlers });
        await router.start();
        expect(page.route).toHaveBeenCalledTimes(1);
        expect(page.route).toHaveBeenCalledWith(
          '/graphql',
          expect.any(Function)
        );
      });
    });

    describe('extending', () => {
      test('should throw an error when adding additional GraphQL handlers if the explicit graphqlUrl that was provided during initialisation is falsy', async () => {
        const handlers = [graphql.query('GetUsers', successResolver)];
        const page = mockPage();
        const router = new Router({
          page,
          config: {
            graphqlUrl: null,
          },
        });
        await expect(() => router.use(...handlers)).rejects.toEqual(
          new Error(
            'Missing "graphqlUrl". This is required to be able to use GraphQL handlers. Please provide it when calling "createWorkerFixture".'
          )
        );
      });

      test('should not throw an error when adding additional GraphQL handlers if an explicit graphqlUrl was provided during initialisation', async () => {
        const handlers = [graphql.query('GetUsers', successResolver)];
        const page = mockPage();
        const router = new Router({ page, config: { graphqlUrl: '/graphql' } });
        await router.start();
        expect.assertions(1);
        const result = await router.use(...handlers);
        expect(result).toBeUndefined();
      });

      test('should utilise the default graphqlUrl for additional GraphQL handlers if one was not provided during initialisation', async () => {
        const handlers = [graphql.query('GetUsers', successResolver)];
        const page = mockPage();
        const router = new Router({ page });
        await router.start();
        await router.use(...handlers);
        expect(page.route).toHaveBeenCalledTimes(1);
        expect(page.route).toHaveBeenCalledWith(
          '/graphql',
          expect.any(Function)
        );
      });
    });
  });
});
