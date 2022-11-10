import { SearchEngine } from '../models/search-engine';
import { test } from '../test';
import { rest } from 'msw';

test.describe.parallel('query parameters', () => {
  test('should allow API calls that have query params to be handled by initial handlers', async ({
    page,
  }) => {
    await page.goto('/search');
    const searchEngine = new SearchEngine(page);
    await searchEngine.setQuery('the');
    await searchEngine.submit();
    await searchEngine.assertSearchResultCount(4);
    await searchEngine.assertSearchResultsVisible([
      'The Godfather',
      'The Shawshank Redemption',
      'The Hobbit - J.R.R. Tolkien',
      'The Gunslinger (The Dark Tower) - Stephen King',
    ]);
  });

  test('should allow API calls that have query params to be handled by extra handlers', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get('/api/search', (request, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              title: 'The Potato',
              href: 'https://fake.domain.com',
              category: 'books',
            },
          ])
        )
      )
    );

    await page.goto('/search');
    const searchEngine = new SearchEngine(page);
    await searchEngine.setQuery('the');
    await searchEngine.submit();
    await searchEngine.assertSearchResultCount(1);
    await searchEngine.assertSearchResultVisible('The Potato');
  });

  test('should behave as though query parameters do not exist if they are specified within the query handler path', async ({
    page,
    worker,
  }) => {
    await worker.use(
      rest.get('/api/search?q=ignoredQuery', (request, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              title: 'Pineapple',
              href: 'https://fake.domain.com',
              category: 'songs',
            },
          ])
        )
      ),
      rest.get('/api/search', (request, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              title: 'Pine Tree',
              href: 'https://fake.domain.com',
              category: 'songs',
            },
          ])
        )
      )
    );

    await page.goto('/search');
    const searchEngine = new SearchEngine(page);
    await searchEngine.setQuery('pine');
    await searchEngine.submit();
    await searchEngine.assertSearchResultCount(1);
    // Like the official MSW, the first handler should have handled it because its query parameters will get ignored
    await searchEngine.assertSearchResultVisible('Pineapple');
  });
});
