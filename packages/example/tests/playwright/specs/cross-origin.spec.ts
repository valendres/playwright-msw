import { SearchEngine } from '../models/search-engine';
import { test } from '../test';
import { rest } from 'msw';

test.describe.parallel('cross-origin mocking', () => {
  test('should allow request to be intercepted from a different backend server with a wildcard origin', async ({
    page,
    worker,
  }) => {
    await worker.resetHandlers(
      rest.get('*/api/search', (_, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              title: 'Wildcard cross-domain result',
              href: 'https://fake.domain.com/',
              category: 'books',
            },
          ])
        )
      )
    );

    await page.goto('/search');
    const searchEngine = new SearchEngine(page);
    await searchEngine.useEndpoint('http://localhost:8080/api/search');
    await searchEngine.setQuery('game');
    await searchEngine.submit();
    await searchEngine.assertSearchResultCount(1);
    await searchEngine.assertSearchResultVisible(
      'Wildcard cross-domain result'
    );
  });

  test('should allow request to be intercepted from a different backend server with an explicit origin', async ({
    page,
    worker,
  }) => {
    await worker.resetHandlers(
      rest.get('http://localhost:8080/api/search', (_, response, context) =>
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
    const searchEngine = new SearchEngine(page);
    await searchEngine.useEndpoint('http://localhost:8080/api/search');
    await searchEngine.setQuery('game');
    await searchEngine.submit();
    await searchEngine.assertSearchResultCount(1);
    await searchEngine.assertSearchResultVisible(
      'Explicit cross-domain result'
    );
  });
});
