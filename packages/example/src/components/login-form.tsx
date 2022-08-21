import { FC, FormEvent, useCallback } from "react";
import { useMutation } from "react-query";
import { LoginApiResponse, LoginApiRequestBody } from "../types/api";

const getLoginFormValues = ({ elements }: HTMLFormElement) => {
  const usernameElement = elements.namedItem("username") as HTMLInputElement;
  const passwordElement = elements.namedItem("password") as HTMLInputElement;
  return {
    username: usernameElement.value,
    password: passwordElement.value,
  };
};

const getLoginErrorMessage = ({ status }: Response) => {
  switch (status) {
    case 401:
      return "Invalid username or password";
    default:
      return "Unknown error";
  }
};

const useLoginMutation = () => {
  return useMutation<
    LoginApiResponse,
    { message: string },
    LoginApiRequestBody
  >(
    ["login"],
    async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/login", {
        method: "POST",
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

export const LoginForm: FC = () => {
  const loginMutation = useLoginMutation();

  const handleFormSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      loginMutation.mutate(getLoginFormValues(event.target as HTMLFormElement));
    },
    [loginMutation.mutate]
  );

  if (loginMutation.isSuccess) {
    return <div role="alert">Successfully signed in!</div>;
  }

  return (
    <div>
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
          {loginMutation.isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};
