import { rest } from 'msw';
import { expect, test } from '../test';

test.describe.parallel('REST', () => {
  test('should use the default handlers without requiring handlers to be specified on a per-test basis', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('text="Hermione"')).toBeVisible();
  });

  test('should allow mocks to be overridden on a per test basis', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get('/api/users', (_, response, context) =>
        response(
          context.delay(250),
          context.status(200),
          context.json([{ name: 'Custom User' }])
        )
      )
    );
    await page.goto('/users');
    await expect(page.locator('text="Custom User"')).toBeVisible();
  });
});
