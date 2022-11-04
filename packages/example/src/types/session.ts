export type SessionData = {
  userId: string;
};

export type GetSessionParams = Record<string, string>;
export type GetSessionResponse = SessionData;

export type PostSessionRequestBody = {
  username: string;
  password: string;
};
export type PostSessionParams = Record<string, string>;
export type PostSessionResponse = SessionData;
