import { FC, FormEvent, useCallback } from 'react';
import { useMutation, useQuery } from 'react-query';
import {
  GetSessionResponse,
  PostSessionResponse,
  PostSessionRequestBody,
} from '../types/session';

const getLoginFormValues = ({ elements }: HTMLFormElement) => {
  const usernameElement = elements.namedItem('username') as HTMLInputElement;
  const passwordElement = elements.namedItem('password') as HTMLInputElement;
  return {
    username: usernameElement.value,
    password: passwordElement.value,
  };
};

const getLoginErrorMessage = ({ status }: Response) => {
  switch (status) {
    case 401:
      return 'Invalid username or password';
    default:
      return 'Unknown error';
  }
};

const useSessionQuery = () => {
  return useQuery<{ status: number; session: GetSessionResponse | null }>(
    ['session'],
    async () => {
      const response = await fetch('/api/session');
      return {
        status: response.status,
        session: response.status === 200 ? await response.json() : null,
      };
    },
    { retry: false, refetchOnWindowFocus: false, refetchOnMount: false }
  );
};

const useLoginMutation = () => {
  return useMutation<
    PostSessionResponse,
    { message: string },
    PostSessionRequestBody
  >(
    ['login'],
    async (credentials: { username: string; password: string }) => {
      const response = await fetch('/api/session', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.status !== 200) {
        throw new Error(getLoginErrorMessage(response));
      }

      return response.json();
    },
    { retry: false }
  );
};

const useLogoutMutation = () => {
  return useMutation(
    ['login'],
    async () => {
      const response = await fetch('/api/session', {
        method: 'DELETE',
      });

      if (response.status !== 200) {
        throw new Error('Failed to logout');
      }
    },
    { retry: false }
  );
};

export const LoginForm: FC = () => {
  const sessionQuery = useSessionQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const handleFormSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      loginMutation.mutate(
        getLoginFormValues(event.target as HTMLFormElement),
        {
          onSuccess: () => sessionQuery.refetch(),
        }
      );
    },
    [loginMutation.mutate]
  );

  const handleLogoutButtonPress = useCallback(() => {
    if (loginMutation.isIdle) {
      logoutMutation.mutate(undefined, {
        onSuccess: () => sessionQuery.refetch(),
      });
    }
  }, [logoutMutation.mutate]);

  if (sessionQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {sessionQuery.data?.session ? (
        <div>
          <div role="alert">Successfully signed in!</div>
          <button onClick={handleLogoutButtonPress}>Logout</button>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit}>
          {loginMutation.isError && (
            <div role="alert">
              <b>Failed to login</b>
              <div>{loginMutation.error?.message}</div>
            </div>
          )}
          <div className="username">
            <label htmlFor="username">Username</label>
            <div>
              <input type="text" name="username" id="username" required />
            </div>
          </div>
          <div className="password">
            <label htmlFor="password">Password</label>
            <div>
              <input type="password" name="password" id="password" required />
            </div>
          </div>
          <button type="submit">
            {loginMutation.isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      )}
      <br />
      <div>
        Session status:{' '}
        <span data-testid="session-status">
          {sessionQuery.isLoading ? 'loading' : sessionQuery.data?.status}
        </span>
      </div>
    </div>
  );
};
