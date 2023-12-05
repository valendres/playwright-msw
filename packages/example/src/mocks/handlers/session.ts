import {
  SessionData,
  GetSessionParams,
  GetSessionResponse,
  PostSessionRequestBody,
  PostSessionResponse,
} from '../../types/session';
import { http, HttpResponse, delay } from 'msw';

const VALID_USERNAME = 'peter';
const VALID_PASSWORD = 'secret';
const SESSION_COOKIE_KEY = 'x-session';

const sessionData: SessionData = {
  userId: '9138123',
};

const encodeSessionCookie = (username: string, password: string) =>
  Buffer.from(`${username}:${password}`).toString('base64');

const decodeSessionCookie = (
  cookie: string
): { username: string; password: string } => {
  const [username, password] = Buffer.from(
    (cookie ?? '').split(',')[0],
    'base64'
  )
    .toString()
    .split(':');
  return {
    username: username ?? null,
    password: password ?? null,
  };
};

const isValidCredentials = (username: string, password: string): boolean =>
  username === VALID_USERNAME && password === VALID_PASSWORD;

const isValidSession = (cookie: string): boolean => {
  const { username, password } = decodeSessionCookie(cookie);
  return isValidCredentials(username, password);
};

export default [
  http.get<GetSessionParams, GetSessionResponse>(
    '/api/session',
    async (request) => {
      await delay(150);
      const sessionCookie = request.cookies[SESSION_COOKIE_KEY];
      return isValidSession(sessionCookie)
        ? HttpResponse.json(sessionData, {
            status: 200,
          })
        : HttpResponse.json(null, {
            status: 401,
          });
    }
  ),
  http.post<PostSessionRequestBody, PostSessionResponse>(
    '/api/session',
    async ({ request }) => {
      await delay(500);
      const { username, password } =
        (await request.json()) as unknown as PostSessionRequestBody;
      if (isValidCredentials(username, password)) {
        return HttpResponse.json(sessionData, {
          status: 200,
          headers: {
            'Set-Cookie': `${SESSION_COOKIE_KEY}=${encodeSessionCookie(
              username,
              password
            )}`,
          },
        });
      }

      return HttpResponse.json(null, {
        status: 401,
      });
    }
  ),
  http.delete('/api/session', async ({ cookies }) => {
    const sessionCookie = cookies[SESSION_COOKIE_KEY];
    return isValidSession(sessionCookie)
      ? HttpResponse.json(null, {
          status: 200,
          headers: {
            'Set-Cookie': `${SESSION_COOKIE_KEY}=; Max-Age=0`,
          },
        })
      : HttpResponse.json(null, {
          status: 401,
        });
  }),
];
