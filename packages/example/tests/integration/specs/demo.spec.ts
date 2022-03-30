import { test } from "../test";

test.describe.parallel("demo", () => {
  test("should load a page", async ({ page }) => {
    await page.goto("/");
  });
});
