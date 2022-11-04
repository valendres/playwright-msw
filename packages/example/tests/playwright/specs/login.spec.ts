import { LoginForm } from "../models/login-form";
import { test } from "../test";
import { rest } from "msw";

test.describe.parallel("login form", () => {
  test("should display an invalid credentials message if the user enters incorrect credentials", async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.post("/api/session", (_, response, context) =>
        response(context.delay(250), context.status(401))
      )
    );
    await page.goto("/login");

    const loginForm = new LoginForm(page);
    await loginForm.setUsername("peter");
    await loginForm.setPassword("secret");
    await loginForm.submit();
    await loginForm.assertError(LoginForm.Error.InvalidCredentials);
  });

  test("should display a success message if the user successfully logs in", async ({
    page,
  }) => {
    await page.goto("/login");

    const loginForm = new LoginForm(page);
    await loginForm.setUsername("peter");
    await loginForm.setPassword("secret");
    await loginForm.submit();
    await loginForm.assertSuccessful();
  });
});
