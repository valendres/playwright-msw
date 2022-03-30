import { FC } from "react";
import { useQuery } from "react-query";
import { UsersApiResponse } from "../types/api";

export type UsersListProps = unknown;

export const UsersList: FC<UsersListProps> = () => {
  const { data: users, isError } = useQuery<UsersApiResponse>(
    "users",
    async () => {
      const response = await fetch("/api/users");
      return await response.json();
    }
  );

  return (
    <div data-testid="users-list">
      {isError ? (
        <span>Failed to load users</span>
      ) : users ? (
        <ul>
          {users.map(({ id, firstName, lastName }) => (
            <li key={id}>{`${firstName} ${lastName}`}</li>
          ))}
        </ul>
      ) : (
        <span>Loading...</span>
      )}
    </div>
  );
};
