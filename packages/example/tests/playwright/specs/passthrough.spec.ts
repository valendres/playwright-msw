import { HttpResponse, http, passthrough } from 'msw';
import { test } from '../test';

test.describe('passthrough', () => {
  test('should show a custom mocked title if overridden', async ({
    worker,
    page,
  }) => {
    await worker.use(
      http.get('/config.json', () =>
        HttpResponse.json({ title: 'title overridden' }, { status: 200 }),
      ),
    );
    await page.goto('/config-title');
    await page.waitForSelector('text=title overridden');
  });

  test('should show mocked title if not overridden', async ({ page }) => {
    await page.goto('/config-title');
    await page.waitForSelector('text=mocked title');
  });

  test('should show real title when passthrough is used', async ({
    worker,
    page,
  }) => {
    await worker.use(http.get('/config.json', () => passthrough()));
    await page.goto('/config-title');
    await page.waitForSelector('text=real title');
  });

  test('should show real title when passthrough is used for a wildcard', async ({
    worker,
    page,
  }) => {
    await worker.use(http.get('/*onfig.json', () => passthrough()));
    await page.goto('/config-title');
    await page.waitForSelector('text=real title');
  });
});
