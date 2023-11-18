/* istanbul ignore file */
import { ResponseResolver, HttpResponse } from 'msw';

export const successResolver: ResponseResolver = () =>
  new HttpResponse(null, {
    status: 200,
  });
