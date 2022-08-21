export type UsersApiParams = Record<string, string>;
export type UsersApiResponse = Array<{
  id: string;
  firstName: string;
  lastName: string;
}>;

export type LoginApiRequestBody = {
  username: string;
  password: string;
};
export type LoginApiParams = Record<string, string>;
export type LoginApiResponse = {
  userId: string;
};
