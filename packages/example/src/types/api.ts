export type UsersApiParams = Record<string, string>;
export type UsersApiResponse = Array<{
  id: string;
  firstName: string;
  lastName: string;
}>;
