import { rest } from 'msw';
import {
  GetDocumentsResponse,
  GetDocumentsParams,
} from '../../types/documents';

export default [
  rest.get<null, GetDocumentsParams, GetDocumentsResponse>(
    '/api/documents/months',
    (_, response, context) =>
      response(
        context.delay(50),
        context.status(200),
        context.json([
          {
            id: '9ef0aeb6-60bb-11ed-9b6a-0242ac120002',
            title: 'january.pdf',
          },
          {
            id: 'aed3c728-60bb-11ed-9b6a-0242ac120002',
            title: 'february.pdf',
          },
          {
            id: 'b60a4418-60bb-11ed-9b6a-0242ac120002 ',
            title: 'march.pdf',
          },
        ])
      )
  ),
  rest.get<null, GetDocumentsParams, GetDocumentsResponse>(
    '/api/documents/:slug',
    (request, response, context) =>
      response(
        context.delay(50),
        context.status(200),
        context.json(
          new Array(3).fill(null).map((_, index) => ({
            id: `${request.params.slug}-${index + 1}`,
            title: `${request.params.slug}-document-${index + 1}.pdf`,
          }))
        )
      )
  ),
];
