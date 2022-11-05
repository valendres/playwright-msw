export type GetUsersParams = Record<string, string>;
export type GetUsersResponse = Array<{
  id: string;
  firstName: string;
  lastName: string;
}>;
