# playwright-msw

A Mock Service Worker API for Playwright

## Setup

`test.ts`

```tsx
import { test as base, expect } from "@playwright/test";
import { rest } from "msw";
import type { MockServiceWorker } from "playwright-msw";
import { createServer } from "playwright-msw";

const handlers = [
  rest.get(
    "/api/user/profile",
    (_, response, context) =>
      response(
        context.delay(250),
        context.status(200),
        context.json({
          firstName: "Joe",
          lastName: "Smith",
          favVegetable: "🍆"
        });
      ),
  ),
];

export const test = base.extend<{
  msw: MockServiceWorker;
  rest: typeof rest;
}>({
  msw: [
    async ({ page }, use, info): Promise<void> => {
      const server = await createServer({
        page,
        info,
        handlers,
        webServerPort: 8080,
        baseWorkerServerPort: 9000,
        url: "/**",
      });

      await server.listen();
      // Test has not started to execute
      await use(server);
      // Test has finished executing
      await server.close();
    },
    {
      /**
       * Scope this fixture on a per test basis to ensure that each test has a
       * fresh copy of MSW.
       */
      scope: "test",
      /**
       * By default, fixtures are lazy; they will not be initalised unless they're
       * used by the test. Setting `true` here means that the fixture will be auto-
       * initialised even if the test doesn't use it.
       */
      auto: true,
    },
  ],
  rest,
});

export { expect };
```

## Usage

`profile-page.spec.ts`

```tsx
import { test, expect } from "./test";

test.describe.parallel("A demo of playwright-msw's functionality", () => {
  test("should use the default handlers without requiring handlers to be specified on a per-test basis", async ({
    page
  }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="favVegetable"]')).toHaveText("🍆");
  });

  test("should allow mocks to be overridden on a per test basis", async ({
    page
    msw,
    rest,
  }) => {
    await msw.use(
      rest.get(
        "/api/user/profile",
        (_, response, context) =>
          response(
            context.delay(250),
            context.status(200),
            context.json({
              firstName: "Joe",
              lastName: "Smith",
              favVegetable: "🥔"
            });
          ),
      ),
    );
    await page.goto("/");
    await expect(page.locator('[data-testid="favVegetable"]')).toHaveText("🥔");
  });
});
```
