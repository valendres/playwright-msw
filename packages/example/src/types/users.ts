export type GetUsersItemApiParams = { userId: string };
export type GetUsersItemApiResponse = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  address: string;
  phoneNumber: string;
};

export type GetUsersCollectionApiParams = Record<string, string>;
export type GetUsersCollectionApiResponse = Array<
  Pick<GetUsersItemApiResponse, "id" | "firstName" | "lastName">
>;
