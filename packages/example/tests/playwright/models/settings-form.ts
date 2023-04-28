import { expect, Page } from '@playwright/test';

export enum SettingsFormError {
  QueryFailed = 'Failed to load settings',
  MutationFailed = 'Failed to update settings',
}

export class SettingsForm {
  static Error = SettingsFormError;

  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Update' }).click();
  }

  async setUseEndpoint2(checked: boolean) {
    await this.page.getByLabel('Use Endpoint 2').setChecked(checked);
  }

  async setNotificationsEnabled(enabled: boolean) {
    await this.page.getByLabel('Notifications').setChecked(enabled);
  }

  async setProfileVisibility(option: string) {
    await this.page.getByLabel('Profile visibility').selectOption(option);
  }

  async assertNotificationsEnabled(enabled: boolean) {
    await expect(this.page.getByLabel('Notifications')).toBeChecked({
      checked: enabled,
    });
  }

  async assertProfileVisibility(visibility: string) {
    await expect(this.page.getByLabel('Profile visibility')).toHaveValue(
      visibility
    );
  }

  async assertSuccessful() {
    await expect(
      this.page.locator('text=Successfully updated settings!')
    ).toBeVisible();
  }

  async assertError(error: SettingsFormError) {
    await expect(this.page.locator(`text=${error}`)).toBeVisible();
  }
}
