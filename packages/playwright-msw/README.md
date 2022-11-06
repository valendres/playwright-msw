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
  worker: createWorkerFixture({}, ...handlers),
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

The `createWorkerFixture(config, ...handlers)` function creates a fixture that mocks api calls on a per-test basis that is automatically started even if the test does not use it directly. The provided handlers will be used by all tests by default. The created [MockServiceWorker](#mockserviceworker) fixture can be optionally used to customise mocks on a per-test basis.

Refer to the [Getting Started: Create a the worker fixture](#create-a-the-worker-fixture) for a usage example. If this abstraction layer is over-simplified for your use case, the [createServer](#createserver) function can be used instead.

#### Configuration

The `createWorkerFixture` function supports the following configuration:

| key        | required | default    | description                                          |
| ---------- | -------- | ---------- | ---------------------------------------------------- |
| graphqlUrl | false    | `/graphql` | The URL of the GraphQL endpoint to send requests to. |

### `createServer`

The `createServer(page: Page, ...handlers: RequestHandler[])` function creates a server that intercepts and mocks API calls for an individual playwright page. The `createServer` returns a [MockServiceWorker](#mockserviceworker) object which can be used for further customization.

Usage example:

```typescript
import { test as base, expect } from '@playwright/test';
import { createServer, MockServiceWorker } from 'playwright-msw';

import handlers from './handlers';

const test = base.extend<{
  worker: MockServiceWorker;
}>({
  worker: [
    async ({ page }, use) => {
      const server = await createServer(page, ...handlers);
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

The `MockServiceWorker` instance exposes a number of utility functions to facilitate additional customisations:

- `use(...customHandlers: RequestHandler[])`: Prepends given request handlers to the list of existing handlers. This is useful for overriding mocks on a per test behaviour, e.g. testing what happens if a particular API call fails.
- `resetHandlers(...customHandlers: RequestHandler[])`: Resets request handlers to the initial list given to the createServer call, or to the explicit next request handlers list, if given.
- `resetCookieStore()`: Resets MSW's internal cookie store by removing all cookies from it. **\*Note:** this is automatically called at the end of each test.\*
