import { LoginForm } from '../models/login-form';
import { test } from '../test';

test.describe.parallel('login form', () => {
  test('should display an invalid credentials message if the user enters incorrect credentials', async ({
    page,
  }) => {
    await page.goto('/login');

    const loginForm = new LoginForm(page);
    await loginForm.loginWithInvalidCredentials();
    await loginForm.assertError(LoginForm.Error.InvalidCredentials);
  });

  test('should display a success message if the user successfully logs in', async ({
    page,
  }) => {
    await page.goto('/login');

    const loginForm = new LoginForm(page);
    await loginForm.loginWithValidCredentials();
    await loginForm.assertSuccessful();
  });
});
