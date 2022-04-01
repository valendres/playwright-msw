# playwright-msw

A Mock Service Worker API for Playwright.

## Setup

The example below shows how `playwright-msw` can be be used to create custom [test fixtures](https://playwright.dev/docs/test-fixtures) which allow API calls to be automatically mocked, while also exposing the `msw` worker instance as a fixture so that mocks may be overridden on a per test basis. For an up to date example, please refer to [test.ts](https://github.com/valendres/playwright-msw/blob/main/packages/example/tests/playwright/test.ts).

```typescript
import { test as base, expect } from "@playwright/test";
import { rest } from "msw";
import type { MockServiceWorker } from "playwright-msw";
import { createWorkerFixture } from "playwright-msw";

const handlers = [
  rest.get("/api/users", (_, response, context) =>
    response(
      context.delay(500),
      context.status(200),
      context.json([
        {
          id: "bcff5c0e-10b6-407b-94d1-90d741363885",
          firstName: "Rhydian",
          lastName: "Greig",
        },
        {
          id: "b44e89e4-3254-415e-b14a-441166616b20",
          firstName: "Alessandro",
          lastName: "Metcalfe",
        },
        {
          id: "6e369942-6b5d-4159-9b39-729646549183",
          firstName: "Erika",
          lastName: "Richards",
        },
      ])
    )
  ),
];

const test = base.extend<{
  worker: MockServiceWorker;
  rest: typeof rest;
}>({
  worker: createWorkerFixture(...handlers),
  rest,
});

export { text, expect };
```

## Usage

The example below shows `playwright-msw` can be used to automatically mock API calls, while still allowing them to be mocked on a per test basis. For an up to date example, please refer to [demo.spec.ts](https://github.com/valendres/playwright-msw/blob/main/packages/example/tests/playwright/specs/demo.spec.ts).

```typescript
import { expect, test } from "../test";

test.describe.parallel("A demo of playwright-msw's functionality", () => {
  test("should use the default handlers without requiring handlers to be specified on a per-test basis", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeVisible();
  });

  test.only("should allow mocks to be overridden on a per test basis", async ({
    page,
    worker,
    rest,
  }) => {
    await worker.use(
      rest.get("/api/users", (_, response, context) =>
        response(context.delay(250), context.status(403))
      )
    );
    await page.goto("/");
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeHidden();
    await expect(page.locator('text="Failed to load users"')).toBeVisible();
  });
});
```
