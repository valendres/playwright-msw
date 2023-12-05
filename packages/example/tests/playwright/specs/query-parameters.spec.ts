import { SearchEngine } from '../models/search-engine';
import { test } from '../test';
import { http, HttpResponse } from 'msw';

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
      http.get('/api/search', () =>
        HttpResponse.json([
          {
            title: 'The Potato',
            href: 'https://fake.domain.com',
            category: 'books',
          },
        ]),
      ),
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
      http.get('/api/search?q=ignoredQuery', () =>
        HttpResponse.json([
          {
            title: 'Pineapple',
            href: 'https://fake.domain.com',
            category: 'songs',
          },
        ]),
      ),
      http.get('/api/search', () =>
        HttpResponse.json([
          {
            title: 'Pine Tree',
            href: 'https://fake.domain.com',
            category: 'songs',
          },
        ]),
      ),
    );

    await page.goto('/search');
    const searchEngine = new SearchEngine(page);
    await searchEngine.setQuery('pine');
    await searchEngine.submit();
    await searchEngine.assertSearchResultCount(1);
    await searchEngine.assertSearchResultVisible('Pineapple');
  });

  test('should allow query parameters to work if there is a trailing slash in the url', async ({
    page,
    worker,
  }) => {
    const endpointWithTrailingSlash = '/api/search/';
    await worker.resetHandlers(
      http.get(endpointWithTrailingSlash, () =>
        HttpResponse.json([
          {
            title: 'Trailing slash',
            href: 'https://fake.domain.com/',
            category: 'books',
          },
        ]),
      ),
    );

    await page.goto('/search');
    const searchEngine = new SearchEngine(page);
    await searchEngine.useEndpoint(endpointWithTrailingSlash);
    await searchEngine.setQuery('game');
    await searchEngine.submit();
    await searchEngine.assertSearchResultCount(1);
    await searchEngine.assertSearchResultVisible('Trailing slash');
  });

  test('should allow route parameters with a trailing slash and query parameters in the url', async ({
    page,
    worker,
  }) => {
    await worker.resetHandlers(
      http.get('/api/:potato/', () =>
        HttpResponse.json([
          {
            title: 'Trailing slash and route parameters',
            href: 'https://fake.domain.com/',
            category: 'books',
          },
        ]),
      ),
    );

    await page.goto('/search');
    const searchEngine = new SearchEngine(page);
    await searchEngine.useEndpoint('/api/search/');
    await searchEngine.setQuery('game');
    await searchEngine.submit();
    await searchEngine.assertSearchResultCount(1);
    await searchEngine.assertSearchResultVisible(
      'Trailing slash and route parameters',
    );
  });
});
