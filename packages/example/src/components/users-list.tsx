import { FC } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { GetUsersCollectionApiResponse } from '../types/users';

export type UsersListProps = unknown;

export const UsersList: FC<UsersListProps> = () => {
  const { data: users, isError } = useQuery<GetUsersCollectionApiResponse>(
    'users',
    async () => {
      const response = await fetch('/api/users');
      return await response.json();
    },
    { retry: false },
  );

  return (
    <div data-testid="users-list">
      <h1>Users</h1>
      {isError ? (
        <span>Failed to load users</span>
      ) : users ? (
        <ul>
          {users.map(({ id, firstName, lastName }) => (
            <li key={id}>
              <Link to={`/users/${id}`}>{`${firstName} ${lastName}`}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <span>Loading...</span>
      )}
    </div>
  );
};
