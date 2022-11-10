import { rest } from 'msw';
import { expect, test } from '../test';

test.describe.parallel('REST example: users list', () => {
  test('should use the default handlers without requiring handlers to be specified on a per-test basis', async ({
    page,
  }) => {
    await page.goto('/users');
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeVisible();
  });

  test('should allow mocks to be overridden on a per test basis', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get('/api/users', (_, response, context) =>
        response(context.delay(250), context.status(403))
      )
    );
    await page.goto('/users');
    await expect(page.locator('text="Failed to load users"')).toBeVisible();
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeHidden();
  });

  test('should allow mock handlers to be reset', async ({ page, worker }) => {
    // Set the status code to 500 temporarily
    await worker.use(
      rest.get('/api/users', (_, response, context) =>
        response(context.delay(250), context.status(500))
      )
    );

    // Reset the handlers so that we go back to using the default ones
    await worker.resetHandlers();

    await page.goto('/users');
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeVisible();
  });

  test('should allow multiple mocks for the same url with different methods', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.put('/api/users', (_, response, context) =>
        response(context.status(200))
      ),
      rest.get('/api/users', (_, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              id: 'fake',
              firstName: 'Potato',
              lastName: 'McTaterson',
            },
          ])
        )
      ),
      rest.patch('/api/users', (_, response, context) =>
        response(context.status(200))
      ),
      rest.delete('/api/users', (_, response, context) =>
        response(context.status(200))
      )
    );

    await page.goto('/users');
    await expect(page.locator('text="Potato McTaterson"')).toBeVisible();
  });

  test('should allow regex patterns to be used for matching the request path', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get(/\/a.{1}i\/us[a-z]{2}s/, (_, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              id: 'regex',
              firstName: 'Regular',
              lastName: 'Expression',
            },
          ])
        )
      )
    );

    await page.goto('/users');
    await expect(page.locator('text="Regular Expression"')).toBeVisible();
  });

  test('should allow navigating to a specific user page without overriding mocks', async ({
    page,
  }) => {
    await page.goto('/users/6e369942-6b5d-4159-9b39-729646549183');
    await expect(
      page.locator('text="erika.richards@example.com"')
    ).toBeVisible();
  });

  test('should allow paths with route parameters to be mocked', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get('/api/users/:userId', (_, response, context) =>
        response(
          context.status(200),
          context.json({
            id: 'testmytestface',
            firstName: 'Testy',
            lastName: 'Mctestface',
            dob: '1969-6-9',
            email: 'test.mc@test.face',
            address: '111 Testy Way',
            phoneNumber: '(123) 456-7890',
          })
        )
      )
    );
    await page.goto('/users/testmytestface');
    await expect(page.locator('text="test.mc@test.face"')).toBeVisible();
  });
});
