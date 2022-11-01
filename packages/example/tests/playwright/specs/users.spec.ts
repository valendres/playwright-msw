import { rest } from "msw";
import { expect, test } from "../test";

test.describe.parallel("A demo of playwright-msw's functionality", () => {
  test("should use the default handlers without requiring handlers to be specified on a per-test basis", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeVisible();
  });

  test("should allow mocks to be overridden on a per test basis", async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get("/api/users", (_, response, context) =>
        response(context.delay(250), context.status(403))
      )
    );
    await page.goto("/users");
    await expect(page.locator('text="Failed to load users"')).toBeVisible();
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeHidden();
  });

  test("should allow mock handlers to be reset", async ({ page, worker }) => {
    // Set the status code to 500 temporarily
    await worker.use(
      rest.get("/api/users", (_, response, context) =>
        response(context.delay(250), context.status(500))
      )
    );

    // Reset the handlers so that we go back to using the default ones
    await worker.resetHandlers();

    await page.goto("/users");
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeVisible();
  });
});
