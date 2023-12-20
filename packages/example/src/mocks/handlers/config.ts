import { HttpResponse, http } from 'msw';

export default [
  http.get('/config.json', () =>
    HttpResponse.json({ title: 'mocked title' }, { status: 200 }),
  ),
];
