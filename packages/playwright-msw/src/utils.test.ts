import { getHandlerUrl, getHandlerType } from "./utils";
import { rest, graphql, ResponseResolver } from "msw";
import { describe, it, expect } from "@jest/globals";

const successResolver: ResponseResolver = (_, response, context) =>
  response(context.status(200));

describe("utils", () => {
  describe("getHandlerType", () => {
    it.each(["get", "post", "put", "delete", "patch"] as const)(
      'should return "rest" if a REST "%s" handler is provided',
      (method) => {
        const handler = rest[method]("abc", successResolver);
        expect(getHandlerType(handler)).toBe("rest");
      }
    );
    it.each(["query", "mutation"] as const)(
      'should return "graphql" if a GraphQL "%s" handler is provided',
      (method) => {
        const handler = graphql[method]("abc", successResolver);
        expect(getHandlerType(handler)).toBe("graphql");
      }
    );
  });

  describe("getHandlerUrl", () => {
    it.each`
      path            | expected
      ${"/api/users"} | ${"/api/users"}
    `('return "$expected" when path is "$path"', ({ path, expected }) => {
      const url = getHandlerUrl(rest.get(path, successResolver));
      expect(url).toStrictEqual(expected);
    });
  });
});
