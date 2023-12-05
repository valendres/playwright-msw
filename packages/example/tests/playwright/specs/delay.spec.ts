import { expect, test } from '../test';
import { delay, http, HttpResponse } from 'msw';

test.describe.parallel('delay', () => {
  test('should send mock response after specified delay in the handler', async ({
    page,
    worker,
  }) => {
    await worker.use(
      http.get('/api/users', async () => {
        await delay(5000);
        return HttpResponse.json([
          {
            id: 'fake',
            firstName: 'Delayed',
            lastName: 'Response',
          },
        ]);
      }),
    );

    await page.goto('/users');

    // Assert that loading text is still visible at 2000ms
    await page.waitForTimeout(2000);
    await expect(page.locator('text="Loading..."')).toBeVisible({ timeout: 0 });

    // Assert that loading text is still visible at 4000ms
    await page.waitForTimeout(2000);
    await expect(page.locator('text="Loading..."')).toBeVisible({ timeout: 0 });

    // Assert that the query has resolved by the 6000ms mark (> 5000ms delay)
    await page.waitForTimeout(2000);
    await expect(page.locator('text="Delayed Response"')).toBeVisible({
      timeout: 0,
    });
  });

  test('should send mock response straight away if no delay has been specified in the handler', async ({
    page,
    worker,
  }) => {
    await worker.use(
      http.get('/api/users', async () => {
        return HttpResponse.json([
          {
            id: 'fake',
            firstName: 'Instant',
            lastName: 'Response',
          },
        ]);
      }),
    );

    await page.goto('/users', { waitUntil: 'networkidle' });
    await expect(page.locator('text="Instant Response"')).toBeVisible({
      timeout: 0,
    });
  });
});
