<h1 align="center">Playwright MSW Example</h1>

A [React](https://reactjs.org/) SPA that utilises [MSW](https://mswjs.io/) to improve development experience. Additionally, it also has a number of [Playwright](https://playwright.dev/) tests to make sure that `playwright-msw`'s integration of the two libraries works as expected.

The SPA contains two different different mechanisms for communicating with a server:

1. [REST](https://restfulapi.net/) via [ReactQuery](https://tanstack.com/query)
2. [GraphQL](https://graphql.org/) via [Apollo](https://www.apollographql.com/docs/react/)

## Getting started

To start a local dev server, do the following: http://127.0.0.1:5173/

```shell
git clone https://github.com/valendres/playwright-msw
cd playwright-msw
yarn
yarn build
cd packages/example
yarn start
```

## Commands

- `build`: Builds the React SPA. Required to be able to run `yarn test`.
- `start`: Starts a local dev server so that you can manually view the UI that is tested by Playwright.
- `test`: Runs the Playwright tests within the [tests/playwright/specs](https://github.com/valendres/playwright-msw/blob/main/packages/example/tests/playwright/specs) folder[^requirements]

[^requirements]: to be able to run the Playwright tests, both `playwright-msw` and the `example` SPA must have been previously built using `yarn build`.

## Tests

The React SPA utilises [React Router](https://reactrouter.com/en/main) to serve the following:

| Route                                                                              | Component                                          | Test                                                        | Description                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [/login](http://127.0.0.1:5173/login)                                              | [LoginForm](./src/components/login-form.tsx)       | [cookies.spec.ts](./tests/playwright/specs/cookies.spec.ts) | An example login form that's used to test the behaviour of cookies. It makes sure that cookies are passed to the MSW handlers and are not unexpectedly leaked across test runs.                                |
| [/users](http://127.0.0.1:5173/users)                                              | [UsersList](./src/components//users-list.tsx)      | [rest.spec.ts](./tests/playwright/specs/rest.spec.ts)       | A simple list of users which is used to test the behaviour of REST handlers. It utilises [ReactQuery](https://tanstack.com/query) to perform the API calls.                                                    |
| [/users/:userId](http://127.0.0.1:5173/users/b44e89e4-3254-415e-b14a-441166616b20) | [UserProfile](./src/components/user-profile.tsx)   | [rest.spec.ts](./tests/playwright/specs/rest.spec.ts)       | A simple user page that shows more details about the user than the `UserList`. It is used to make sure that [Route parameters](https://expressjs.com/en/guide/routing.html#route-parameters) work as expected. |
| [/settings](http://127.0.0.1:5173/settings)                                        | [SettingsForm](./src/components/settings-form.tsx) | [graphql.spec.ts](./tests/playwright/specs/graphql.ts)      | A basic settings page to make sure that GraphQL queries and mutations work. It utilises [Apollo Client](https://www.apollographql.com/docs/react/) to perform the API calls.                                   |

## Footnotes
