import { expect, Page } from "@playwright/test";

export enum LoginFormError {
  InvalidCredentials = "Invalid username or password",
}

export class LoginForm {
  static Error = LoginFormError;

  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setUsername(username: string) {
    // Type into an input by its label
    await this.page.locator('label:text("Username")').type(username);
  }

  async setPassword(password: string) {
    // Type into an input by its label
    await this.page.locator('label:text("Password")').type(password);
  }

  async submit() {
    // Click a button by its accessibility role
    await this.page.locator('role=button[name="Sign in"]').click();
  }

  async assertError(error: LoginFormError) {
    await expect(
      this.page.locator(`text=Failed to login${error}`)
    ).toBeVisible();
  }

  async assertSuccessful() {
    await expect(
      this.page.locator("text=Successfully signed in!")
    ).toBeVisible();
  }
}
