import { expect, Page } from '@playwright/test';

export class DocumentsList {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async selectSlug(slug: 'months' | 'secret' | 'test') {
    await this.page.getByLabel('Slug').selectOption(slug);
  }

  async assertDocumentVisible(title: string) {
    await expect(this.page.locator(`text=${title}`)).toBeVisible();
  }
}
