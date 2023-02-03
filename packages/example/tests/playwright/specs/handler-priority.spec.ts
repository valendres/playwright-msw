import { DocumentsList } from '../models/documents-list';
import { test } from '../test';
import { rest } from 'msw';

test.describe.parallel('handler priority', () => {
  test('should process initial handlers in the order in which they are defined where index 0 is processed first', async ({
    page,
  }) => {
    /**
     * The expected behaviour is that we render documents with explicit month names. The reason
     * why we expect this is because within `../../../src/mocks/handlers/documents.ts`, there are
     * two handlers that are defined in the following order:
     *
     *  1. `/api/documents/months` that returns an array of documents with explicit month names
     *  2. `/api/documents/:slug` that returns a generated array of 3 elements with format: `${slug}-document-${index}.pdf`
     *
     * When MSW is running in a browser, an API call to `/api/documents/months` should be handled by the first handler.
     */
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
      rest.get('/api/documents/secret', (request, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              id: 'a',
              title: 'goat',
            },
            {
              id: 'b',
              title: 'camel',
            },
          ])
        )
      ),
      rest.get('/api/documents/:slug', (request, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              id: 'slug',
              title: 'Sluggymcslugface',
            },
          ])
        )
      )
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
      rest.get('/api/documents/test', (request, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              id: 'a',
              title: 'apple',
            },
            {
              id: 'o',
              title: 'orange',
            },
          ])
        )
      ),
      rest.get('/api/documents/:slug', (request, response, context) =>
        response(
          context.status(200),
          context.json([
            {
              id: 'p',
              title: 'potato',
            },
          ])
        )
      )
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
