import { DocumentsList } from '../models/documents-list';
import { test } from '../test';
import { http, HttpResponse } from 'msw';

test.describe.parallel('handler priority', () => {
  test('should process initial handlers in the order in which they are defined where index 0 is processed first', async ({
    page,
  }) => {
    await page.goto('/documents');
    const documentsList = new DocumentsList(page);
    await documentsList.selectSlug('months');
    await documentsList.assertDocumentVisible('january.pdf');
    await documentsList.assertDocumentVisible('february.pdf');
    await documentsList.assertDocumentVisible('march.pdf');
  });

  test('should process extra handlers in the order in which they are defined where index 0 is processed first', async ({
    page,
    worker,
  }) => {
    await worker.use(
      http.get('/api/documents/secret', () =>
        HttpResponse.json([
          {
            id: 'a',
            title: 'goat',
          },
          {
            id: 'b',
            title: 'camel',
          },
        ]),
      ),
      http.get('/api/documents/:slug', () =>
        HttpResponse.json([
          {
            id: 'slug',
            title: 'Sluggymcslugface',
          },
        ]),
      ),
    );

    await page.goto('/documents');
    const documentsList = new DocumentsList(page);
    await documentsList.selectSlug('secret');
    await documentsList.assertDocumentVisible('goat');
    await documentsList.assertDocumentVisible('camel');
  });

  test('should process reset handlers in the order in which they are defined where index 0 is processed first', async ({
    page,
    worker,
  }) => {
    await worker.resetHandlers(
      http.get('/api/documents/test', () =>
        HttpResponse.json([
          {
            id: 'a',
            title: 'apple',
          },
          {
            id: 'o',
            title: 'orange',
          },
        ]),
      ),
      http.get('/api/documents/:slug', () =>
        HttpResponse.json([
          {
            id: 'p',
            title: 'potato',
          },
        ]),
      ),
    );

    await page.goto('/documents');
    const documentsList = new DocumentsList(page);
    await documentsList.selectSlug('test');
    await documentsList.assertDocumentVisible('apple');
    await documentsList.assertDocumentVisible('orange');
  });

  test('should fallback to using using the next handler if the first one did not match it', async ({
    page,
  }) => {
    await page.goto('/documents');
    const documentsList = new DocumentsList(page);
    await documentsList.selectSlug('secret');
    await documentsList.assertDocumentVisible('secret-document-1.pdf');
    await documentsList.assertDocumentVisible('secret-document-2.pdf');
    await documentsList.assertDocumentVisible('secret-document-3.pdf');
  });
});
