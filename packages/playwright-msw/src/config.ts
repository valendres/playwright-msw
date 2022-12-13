export type Config = {
  /**
   * The URL of the GraphQL endpoint to send requests to.
   *
   * **Note**: This is only required if you're app uses GraphQL.
   */
  graphqlUrl?: string;

  /**
   * Skips mocking initial page requests, i.e. static asset calls that happen before the page has loaded.
   */
  skipInitialRequests?: boolean;
};
