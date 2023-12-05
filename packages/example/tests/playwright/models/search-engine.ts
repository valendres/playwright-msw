import { expect, Page } from '@playwright/test';

export class SearchEngine {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setQuery(query: string) {
    await this.page.getByLabel(/Query/).fill(query);
  }

  async setCategory(category: string) {
    await this.page.getByLabel(/Category/).selectOption(category);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Search' }).click();
  }

  async assertSearchResultCount(count: number) {
    await expect(this.page.locator('li')).toHaveCount(count);
  }

  async assertSearchResultsVisible(expectedSearchResults: string[]) {
    for (const expectedSearchResult of expectedSearchResults) {
      await this.assertSearchResultVisible(expectedSearchResult);
    }
  }

  async assertSearchResultVisible(expectedSearchResult: string) {
    await expect(this.page.getByText(expectedSearchResult)).toBeVisible();
  }

  async useEndpoint(
    endpoint:
      | '/api/search'
      | '/api/search/'
      | 'http://localhost:8080/api/search',
  ) {
    await this.page.getByTestId('endpoint').selectOption(endpoint);
  }
}
