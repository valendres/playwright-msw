import { expect, Page } from '@playwright/test';

export enum LoginFormError {
  InvalidCredentials = 'Invalid username or password',
}

export class LoginForm {
  static Error = LoginFormError;

  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setUsername(username: string) {
    await this.page.getByLabel('Username').fill(username);
  }

  async setPassword(password: string) {
    await this.page.getByLabel('Password').fill(password);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  async loginWithValidCredentials() {
    await this.setUsername('peter');
    await this.setPassword('secret');
    await this.submit();
  }

  async loginWithInvalidCredentials() {
    await this.setUsername('peter');
    await this.setPassword('incorrect');
    await this.submit();
  }

  async logout() {
    await this.page.getByRole('button', { name: 'Logout' }).click();
  }

  async assertError(error: LoginFormError) {
    await expect(
      this.page.locator(`text=Failed to login${error}`)
    ).toBeVisible();
  }

  async assertSuccessful() {
    await expect(
      this.page.locator('text=Successfully signed in!')
    ).toBeVisible();
  }

  async assertSessionStatus(status: number) {
    await expect(
      this.page.locator(`text=Session status: ${status}`)
    ).toBeVisible();
  }
}
