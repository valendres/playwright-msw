import { delay, http, HttpResponse } from 'msw';
import { expect, test } from '../test';

test.describe.parallel('HTTP', () => {
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
      http.get('/api/users', async () => {
        await delay(250);
        return HttpResponse.json([{ name: 'Custom User' }]);
      }),
    );
    await page.goto('/users');
    await expect(page.locator('text="Custom User"')).toBeVisible();
  });
});
