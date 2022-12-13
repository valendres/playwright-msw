<h1 align="center">Playwright MSW</h1>
<p align="center">A <a href="https://mswjs.io/">Mock Service Worker</a> (MSW) integration layer for <a href="https://playwright.dev/">Playwright</a>.</p>

<p align="center">
<img src="https://img.shields.io/npm/v/playwright-msw?style=for-the-badge&label=Latest&color=black" alt="Package version" />
<img src="https://img.shields.io/github/license/valendres/playwright-msw?style=for-the-badge&color=black" alt="License" />
<img src="https://img.shields.io/npm/dm/playwright-msw?style=for-the-badge&color=black" alt="Downloads per month"/>
</p>

## Features

- **Powerful**. Intercept and mock network requests that are performed by browsers during Playwright test execution.
- **Customizable**. Runs within context of an individual test, mocks can be safely manipulated on a per-test basis without interfering with others that are executing in parallel.
- **Flexible**. Like the [official MSW library](https://github.com/mswjs/msw) that runs within the browser, playwright-msw supports both REST and GraphQL.
- **Easy to implement**. No code changes are required to your app. [^implementation]

[^implementation]: If the target application is already running MSW in the browser (e.g. a local dev server), this will need to be disabled while the Playwright tests are executing. It is recommended to test against the production bundle.

## Announcement

Version 2 introduced a minor breaking change to the [createWorkerFixture](#createworkerfixture) function. To upgrade, please refer to the [V2 migration guide](#v2-migration-guide).

## Getting started

### Prerequisites

This library assumes that you have the following peer dependencies are already installed:

- [@playwright/test](https://www.npmjs.com/package/@playwright/test)
- [msw](https://www.npmjs.com/package/msw)

### Install

To start, install the dependency using your preferred package manager:

```shell
npm install playwright-msw --save-dev
# or
yarn add playwright-msw --dev
```

### Setup

#### Create mock handlers

If you haven't already done so, [create some mock handlers](https://mswjs.io/docs/getting-started/mocks) for API calls that your app will perform. e.g. within a [handlers.ts](https://github.com/valendres/playwright-msw/blob/main/packages/example/src/mocks/handlers.ts) file:

```typescript
import { rest } from 'msw';

/** A collection of handlers to be used by default for all tests. */
export default [
  rest.get('/api/users', (_, response, context) =>
    response(
      context.delay(500),
      context.status(200),
      context.json([
        {
          id: 'bcff5c0e-10b6-407b-94d1-90d741363885',
          firstName: 'Rhydian',
          lastName: 'Greig',
        },
        {
          id: 'b44e89e4-3254-415e-b14a-441166616b20',
          firstName: 'Alessandro',
          lastName: 'Metcalfe',
        },
        {
          id: '6e369942-6b5d-4159-9b39-729646549183',
          firstName: 'Erika',
          lastName: 'Richards',
        },
      ])
    )
  ),
];
```

#### Create a the worker fixture

The next step is to [create a custom fixture](https://playwright.dev/docs/test-fixtures#creating-a-fixture) using the [createWorkerFixture](#createworkerfixture) function from `playwright-msw`. e.g. within a custom [test.ts](https://github.com/valendres/playwright-msw/blob/main/packages/example/tests/playwright/test.ts) file:

If you're using REST API's, all you need to do is provide your handlers to `createWorkerFixture`, no config object is required:

```typescript
import { test as base, expect } from '@playwright/test';
import type { MockServiceWorker } from 'playwright-msw';
import { createWorkerFixture } from 'playwright-msw';

import handlers from './handlers';

const test = base.extend<{
  worker: MockServiceWorker;
}>({
  worker: createWorkerFixture(handlers),
});

export { test, expect };
```

**Note:** if you're using GraphQL, then it is assumed that the calls are made over HTTP. The default uri for the graphql endpoint is `/graphql`. This can be customized via [configuration](#configuration) object when creating the worker.

### Use the custom test fixture

The final step is to use the extended `test` implementation within your playwright tests. e.g. within a [demo.spec.ts](https://github.com/valendres/playwright-msw/blob/main/packages/example/tests/playwright/specs/demo.spec.ts) file:

```typescript
import { rest } from 'msw';
import { expect, test } from '../test';

test.describe.parallel("A demo of playwright-msw's functionality", () => {
  test('should use the default handlers without requiring handlers to be specified on a per-test basis', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeVisible();
  });

  test.only('should allow mocks to be overridden on a per test basis', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get('/api/users', (_, response, context) =>
        response(context.delay(250), context.status(403))
      )
    );
    await page.goto('/');
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeHidden();
    await expect(page.locator('text="Failed to load users"')).toBeVisible();
  });
});
```

## API

### `createWorkerFixture`

The `createWorkerFixture(handlers, config)` function creates a fixture that mocks api calls on a per-test basis that is automatically started even if the test does not use it directly. The provided handlers will be used by all tests by default. The created [MockServiceWorker](#mockserviceworker) fixture can be optionally used to customise mocks on a per-test basis.

Refer to the [Getting Started: Create a the worker fixture](#create-a-the-worker-fixture) for a usage example. If this abstraction layer is over-simplified for your use case, the [createWorker](#createWorker) function can be used instead.

#### Configuration

The `createWorkerFixture` function supports an optional configuration object with the following parameters:

| key             | required | default      | description                                                                                                                                                                                                                                                                                          |
| --------------- | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| graphqlUrl      | false    | `"/graphql"` | The URL of the GraphQL endpoint to send requests to.                                                                                                                                                                                                                                                 |
| waitForPageLoad | false    | `false`      | Waits for the page to load before mocking API calls. When enabled, it allows `playwright-msw` to mirror the behaviour of `msw` when it is running in the browser, where the initial static resource requests will not be mocked because `msw` will have only been initialized until after page load. |

When enabled, it allows `playwright-msw` to emulate the behavior of `msw` when running in the browser, i.e. initialize after page load |

### `createWorker`

The `createWorker(page: Page, handlers?: RequestHandler[], config?: Config)` function creates a server that intercepts and mocks API calls for an individual playwright page. It returns a [MockServiceWorker](#mockserviceworker) object which can be used for further customization.

Usage example:

```typescript
import { test as base, expect } from '@playwright/test';
import { createWorker, MockServiceWorker } from 'playwright-msw';

import handlers from './handlers';

const test = base.extend<{
  worker: MockServiceWorker;
}>({
  worker: [
    async ({ page }, use) => {
      const server = await createWorker(page, handlers);
      // Test has not started to execute...
      await use(server);
      // Test has finished executing...
      // [insert any cleanup actions here]
    },
    {
      /**
       * Scope this fixture on a per test basis to ensure that each test has a
       * fresh copy of MSW. Note: the scope MUST be "test" to be able to use the
       * `page` fixture as it is not possible to access it when scoped to the
       * "worker".
       */
      scope: 'test',
      /**
       * By default, fixtures are lazy; they will not be initalised unless they're
       * used by the test. Setting `true` here means that the fixture will be auto-
       * initialised even if the test doesn't use it.
       */
      auto: true,
    },
  ],
});

export { test, expect };
```

### `MockServiceWorker`

The `MockServiceWorker` instance returned by [createWorker](#createworker) or exposed via [createWorkerFixture](#createworkerfixture) has a number of utility functions to facilitate additional customisations:

- `use(...customHandlers: RequestHandler[])`: Prepends given request handlers to the list of existing handlers. This is useful for overriding mocks on a per test behaviour, e.g. testing what happens if a particular API call fails.
- `resetHandlers(...customHandlers: RequestHandler[])`: Resets request handlers to the initial list given to the createWorker call, or to the explicit next request handlers list, if given.
- `resetCookieStore()`: Resets MSW's internal cookie store by removing all cookies from it. **\*Note:** this is automatically called at the end of each test.\*

## Examples

This library tests itself to make sure the integration between MSW and Playwright is working as expected. For real examples of how it can be used, please refer to:
[packages/example/README.md](../example/README.md)

## v2 migration guide

`playwright-msw@2` introduced a very minor breaking change to the [createWorkerFixture](#createworkerfixture) function. Previously it accepted handlers via rest parameters, but now the first argument must be an array of handlers. This change was made to facilitate providing an optional configuration object as the second argument.

```diff
public class Hello1
const test = base.extend<{
  worker: MockServiceWorker;
}>({
-  worker: createWorkerFixture(...handlers),
+  worker: createWorkerFixture(handlers),
});
```

## Acknowledgements

This library does not seek to steal any thunder, it merely unifies two amazing tools that have already been built:

1. [kettanaito](https://github.com/kettanaito) for creating [MSW](https://mswjs.io/)
2. [Microsoft](https://github.com/microsoft) for creating [Playwright](https://playwright.dev/)

Thank you for making these tools and thank you to the numerous people who have contributed to `playwright-msw` 🙂

## Footnotes
