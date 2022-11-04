import { LoginForm } from "../models/login-form";
import { test } from "../test";

// NOTE: tests are intentionally sequential, do not use `test.describe.parallel` here
test.describe.serial("cookies", () => {
  test("should not have a session cookie if the user has not logged in yet", async ({
    page,
  }) => {
    await page.goto("/login");

    const loginForm = new LoginForm(page);
    await loginForm.assertSessionStatus(401);
  });

  test("should have a valid session once the user logs in", async ({
    page,
  }) => {
    await page.goto("/login");

    const loginForm = new LoginForm(page);
    await loginForm.setUsername("peter");
    await loginForm.setPassword("secret");
    await loginForm.submit();

    await loginForm.assertSessionStatus(200);
  });

  test("should still have a valid session if the user refreshes the page after logging in", async ({
    page,
  }) => {
    await page.goto("/login");

    const loginForm = new LoginForm(page);
    await loginForm.setUsername("peter");
    await loginForm.setPassword("secret");
    await loginForm.submit();

    // Reload the page
    await page.reload();

    await loginForm.assertSessionStatus(200);
  });

  test("should not have a session from the previous test run", async ({
    page,
  }) => {
    await page.goto("/login");

    const loginForm = new LoginForm(page);

    await loginForm.assertSessionStatus(401);
  });

  test("should allow the user to clear their session by logging out", async ({
    page,
  }) => {
    await page.goto("/login");

    const loginForm = new LoginForm(page);

    await loginForm.setUsername("peter");
    await loginForm.setPassword("secret");
    await loginForm.submit();

    await loginForm.assertSessionStatus(200);
    await loginForm.logout();
    await loginForm.assertSessionStatus(401);
  });
});
