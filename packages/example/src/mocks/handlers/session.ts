import {
  SessionData,
  GetSessionParams,
  GetSessionResponse,
  PostSessionRequestBody,
  PostSessionParams,
  PostSessionResponse,
} from "../../types/session";
import { rest } from "msw";

const VALID_USERNAME = "peter";
const VALID_PASSWORD = "secret";
const SESSION_COOKIE_KEY = "x-session";

const sessionData: SessionData = {
  userId: "9138123",
};

const encodeSessionCookie = (username: string, password: string) =>
  // This isn't secure, please don't do this in production code 😇
  Buffer.from(`${username}:${password}`).toString("base64");

const decodeSessionCookie = (
  cookie: string
): { username: string; password: string } => {
  const [username, password] = Buffer.from(cookie ?? "", "base64")
    .toString()
    .split(":");
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
  rest.get<null, GetSessionParams, GetSessionResponse>(
    "/api/session",
    async (request, response, context) => {
      const sessionCookie = request.cookies[SESSION_COOKIE_KEY];
      return isValidSession(sessionCookie)
        ? response(
            context.delay(150),
            context.status(200),
            context.json(sessionData)
          )
        : response(context.delay(150), context.status(401));
    }
  ),
  rest.post<PostSessionRequestBody, PostSessionParams, PostSessionResponse>(
    "/api/session",
    async (request, response, context) => {
      const { username, password } =
        await request.json<PostSessionRequestBody>();
      if (isValidCredentials(username, password)) {
        return response(
          context.delay(500),
          context.status(200),
          context.cookie(
            SESSION_COOKIE_KEY,
            encodeSessionCookie(username, password)
          ),
          context.json(sessionData)
        );
      }

      return response(context.delay(500), context.status(401));
    }
  ),
  rest.delete("/api/session", async (request, response, context) => {
    const sessionCookie = request.cookies[SESSION_COOKIE_KEY];
    return isValidSession(sessionCookie)
      ? response(context.status(200), context.cookie(SESSION_COOKIE_KEY, ""))
      : response(context.status(401));
  }),
];
