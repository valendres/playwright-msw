import { rest } from 'msw';

export const testHandlers = [
  rest.get('/api/users', async (_, response, context) => {
    return response(
      context.status(200),
      context.delay(500),
      context.json([{ name: 'Harry' }, { name: 'Ron' }, { name: 'Hermione' }])
    );
  }),
];
