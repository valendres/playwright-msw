export type Config = {
  /**
   * The URL of the GraphQL endpoint to send requests to.
   *
   * **Note**: This is only required if you're app uses GraphQL.
   */
  graphqlUrl?: string;

  /**
   * Waits for the page to load before mocking API calls. When enabled, it allows `playwright-msw`
   * to mirror the behaviour of `msw` when it is running in the browser, where the initial static
   * resource requests will not be mocked because `msw` will have only been initialized until
   * after page load.
   */
  waitForPageLoad?: boolean;
};

export const DEFAULT_CONFIG: Config = {
  graphqlUrl: '/graphql',
  waitForPageLoad: true,
};
