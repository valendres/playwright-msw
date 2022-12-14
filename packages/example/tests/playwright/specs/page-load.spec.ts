import { rest } from 'msw';
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
