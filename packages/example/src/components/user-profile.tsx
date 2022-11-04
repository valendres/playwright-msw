import { FC } from "react";
import { useQuery } from "react-query";
import { useParams, Link } from "react-router-dom";
import { GetUsersItemApiResponse } from "../types/api";

export type UserProfileProps = unknown;

export const UserProfile: FC<UserProfileProps> = () => {
  const { userId } = useParams();
  const { data: user, isError } = useQuery<GetUsersItemApiResponse>(
    ["user", userId],
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return await response.json();
    },
    { retry: false }
  );

  return (
    <div data-testid="user-profile">
      {isError ? (
        <span>Failed to load user</span>
      ) : user ? (
        <div>
          <h1>{`${user.firstName} ${user.lastName}`}</h1>
          <ul>
            <li>
              <b>id:</b> {user.id}
            </li>
            <li>
              <b>Date of birth:</b> {user.dob}
            </li>
            <li>
              <b>Email:</b> {user.email}
            </li>
            <li>
              <b>Phone number:</b> {user.phoneNumber}
            </li>
          </ul>
        </div>
      ) : (
        <span>Loading...</span>
      )}
      <Link to="/users">Go back...</Link>
    </div>
  );
};
