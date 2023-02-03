import { rest } from 'msw';
import { SearchEngine } from '../models/search-engine';
import { testFactory, expect } from '../test';

const testWaitForPageLoadTrue = testFactory({
  waitForPageLoad: true,
});

testWaitForPageLoadTrue.describe('waitForPageLoad set to true', () => {
  testWaitForPageLoadTrue(
    'should bypass initial page load requests (i.e. static assets)',
    async ({ page, worker }) => {
      await worker.resetHandlers(
        rest.get('*/search', (_, response, context) =>
          response(
            context.status(200),
            context.json([
              {
                title: 'Explicit cross-domain result',
                href: 'https://fake.domain.com/',
                category: 'books',
              },
            ])
          )
        )
      );

      await page.goto('/search');
      await expect(
        page.getByRole('heading', { name: 'Search engine' })
      ).toBeVisible();
    }
  );

  testWaitForPageLoadTrue(
    'should mock subsequent requests immediately after page load (i.e. API calls)',
    async ({ page, worker }) => {
      await worker.resetHandlers(
        rest.get('*/users', (_, response, context) =>
          response(
            context.status(200),
            context.json([
              {
                id: 'fake',
                firstName: '🥔',
                lastName: 'Emoji',
              },
            ])
          )
        )
      );

      await page.goto('/users');
      await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
      await expect(page.locator('text="🥔 Emoji"')).toBeVisible();
    }
  );

  testWaitForPageLoadTrue(
    'should mock delayed requests after page load (i.e. API calls)',
    async ({ page, worker }) => {
      await worker.resetHandlers(
        rest.get('*/search', (_, response, context) =>
          response(
            context.status(200),
            context.json([
              {
                title: '🍆',
                href: 'https://eggplant.domain.com/',
                category: 'books',
              },
            ])
          )
        )
      );

      await page.goto('/search');

      await expect(
        page.getByRole('heading', { name: 'Search engine' })
      ).toBeVisible();

      // Add arbitrary delay
      await page.waitForTimeout(2000);

      const searchEngine = new SearchEngine(page);
      await searchEngine.setQuery('eggplant');
      await searchEngine.submit();
      await searchEngine.assertSearchResultCount(1);
      await searchEngine.assertSearchResultVisible('🍆');
    }
  );
});

const testWaitForPageLoadFalse = testFactory({
  waitForPageLoad: false,
});

testWaitForPageLoadFalse.describe('waitForPageLoad set to false', () => {
  testWaitForPageLoadFalse(
    'should not bypass initial page load requests (i.e. static assets)',
    async ({ page, worker }) => {
      await worker.resetHandlers(
        rest.get('*/search', (_, response, context) =>
          response(
            context.status(200),
            context.json({ message: 'Mocked static resource call' })
          )
        )
      );

      await page.goto('/search');
      await expect(
        page.getByText('{"message":"Mocked static resource call"}')
      ).toBeVisible();
    }
  );
});
