/* istanbul ignore file */
import { ResponseResolver } from 'msw';

export const successResolver: ResponseResolver = (_, response, context) =>
  response(context.status(200));
