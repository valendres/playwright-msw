import { expect, test } from '../test';
import { rest } from 'msw';

test.describe.parallel('delay', () => {
  test('should send mock response after specified delay in the handler', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get('/api/users', (_, response, context) =>
        response(
          context.delay(500),
          context.json([
            {
              id: 'fake',
              firstName: 'Delayed',
              lastName: 'Response',
            },
          ])
        )
      )
    );

    await page.goto('/users');

    // Assert that loading text is still visible at 200ms
    await page.waitForTimeout(200);
    await expect(page.locator('text="Loading..."')).toBeVisible({ timeout: 0 });

    // Assert that loading text is still visible at 400ms
    await page.waitForTimeout(200);
    await expect(page.locator('text="Loading..."')).toBeVisible({ timeout: 0 });

    // Assert that the query has resolved by the 600ms mark (> 500ms delay)
    await page.waitForTimeout(200);
    await expect(page.locator('text="Delayed Response"')).toBeVisible({
      timeout: 0,
    });
  });

  test('should send mock response straight away if no delay has been specified in the handler', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get('/api/users', (_, response, context) =>
        response(
          context.json([
            {
              id: 'fake',
              firstName: 'Instant',
              lastName: 'Response',
            },
          ])
        )
      )
    );

    await page.goto('/users');

    // wait a little bit just to make sure DOM has had time to update
    await page.waitForTimeout(10);
    await expect(page.locator('text="Instant Response"')).toBeVisible({
      timeout: 0,
    });
  });
});
