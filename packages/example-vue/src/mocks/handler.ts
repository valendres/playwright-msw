import { http, delay, HttpResponse } from 'msw';

export const testHandlers = [
  http.get(
    '/api/users',

    async () => {
      await delay();
      return HttpResponse.json([
        { name: 'Harry' },
        { name: 'Ron' },
        { name: 'Hermione' },
      ]);
    },
  ),
];
