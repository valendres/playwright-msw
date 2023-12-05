import { http, HttpResponse, delay } from 'msw';
import {
  GetDocumentsResponse,
  GetDocumentsParams,
} from '../../types/documents';

export default [
  http.get<GetDocumentsParams, GetDocumentsResponse>(
    '/api/documents/months',
    async () => {
      await delay();
      return HttpResponse.json([
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
      ]);
    }
  ),
  http.get<GetDocumentsParams, GetDocumentsResponse>(
    '/api/documents/:slug',
    async ({ params }) => {
      await delay();
      return HttpResponse.json(
        new Array(3).fill(null).map((_, index) => ({
          id: `${params.slug}-${index + 1}`,
          title: `${params.slug}-document-${index + 1}.pdf`,
        }))
      );
    }
  ),
];
