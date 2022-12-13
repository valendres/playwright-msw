import { rest } from 'msw';
import { testFactory, expect } from '../test';

const test = testFactory({
  waitForPageLoad: true,
});

test.describe('skip initial requests set to true', () => {
  test('should bypass initial page load requests (i.e. static assets)', async ({
    page,
    worker,
  }) => {
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
  });
});
