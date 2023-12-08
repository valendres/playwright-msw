import { http, HttpResponse, delay } from 'msw';
import { expect, test } from '../test';

test.describe.parallel('HTTP example: users list', () => {
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
      http.get('/api/users', async () => {
        await delay(250);
        return new HttpResponse(null, {
          status: 403,
        });
      }),
    );
    await page.goto('/users');
    await expect(page.locator('text="Failed to load users"')).toBeVisible();
    await expect(page.locator('text="Alessandro Metcalfe"')).toBeHidden();
  });

  test('should allow mock handlers to be reset', async ({ page, worker }) => {
    // Set the status code to 500 temporarily
    await worker.use(
      http.get('/api/users', async () => {
        await delay(250);
        return HttpResponse.json(null, {
          status: 500,
        });
      }),
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
      http.put('/api/users', () =>
        HttpResponse.json(null, {
          status: 200,
        }),
      ),
      http.get('/api/users', () =>
        HttpResponse.json([
          {
            id: 'fake',
            firstName: 'Potato',
            lastName: 'McTaterson',
          },
        ]),
      ),
      http.patch('/api/users', () => HttpResponse.json(null, { status: 200 })),
      http.delete('/api/users', () => HttpResponse.json(null, { status: 200 })),
    );

    await page.goto('/users');
    await expect(page.locator('text="Potato McTaterson"')).toBeVisible();
  });

  test('should allow regex patterns to be used for matching the request path', async ({
    page,
    worker,
  }) => {
    await worker.use(
      http.get(/\/a.{1}i\/us[a-z]{2}s/, () =>
        HttpResponse.json([
          {
            id: 'regex',
            firstName: 'Regular',
            lastName: 'Expression',
          },
        ]),
      ),
    );

    await page.goto('/users');
    await expect(page.locator('text="Regular Expression"')).toBeVisible();
  });

  test('should allow navigating to a specific user page without overriding mocks', async ({
    page,
  }) => {
    await page.goto('/users/6e369942-6b5d-4159-9b39-729646549183');
    await expect(
      page.locator('text="erika.richards@example.com"'),
    ).toBeVisible();
  });

  test('should allow paths with route parameters to be mocked', async ({
    page,
    worker,
  }) => {
    await worker.use(
      http.get('/api/users/:userId', () =>
        HttpResponse.json({
          id: 'testmytestface',
          firstName: 'Testy',
          lastName: 'Mctestface',
          dob: '1969-6-9',
          email: 'test.mc@test.face',
          address: '111 Testy Way',
          phoneNumber: '(123) 456-7890',
        }),
      ),
    );
    await page.goto('/users/testmytestface');
    await expect(page.locator('text="test.mc@test.face"')).toBeVisible();
  });

  test('should allow paths with route with `*` to be mocked', async ({
    page,
    worker,
  }) => {
    await worker.use(
      http.get('/a*i/us*/:userId', () =>
        HttpResponse.json({
          id: 'testmytestface',
          firstName: 'Testy',
          lastName: 'Mctestface',
          dob: '1969-6-9',
          email: 'test.mc@test.face',
          address: '111 Testy Way',
          phoneNumber: '(123) 456-7890',
        }),
      ),
    );
    await page.goto('/users/testmytestface');
    await expect(page.locator('text="test.mc@test.face"')).toBeVisible();
  });
});
