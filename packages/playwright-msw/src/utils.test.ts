import {
  getHandlerPath,
  getHandlerType,
  serializePath,
  SerializedPath,
  deserializePath,
} from './utils';
import { http, graphql, ResponseResolver, Path, HttpResponse } from 'msw';
import { describe, it, expect } from '@jest/globals';
import { convertMswPathToPlaywrightUrl } from './utils';

const successResolver: ResponseResolver = () =>
  new HttpResponse(null, {
    status: 200,
  });

describe('utils', () => {
  describe('serializePath', () => {
    it.each<{ path: Path; expected: Path }>`
      path            | expected
      ${'/api/users'} | ${'string:/api/users'}
      ${/^\/api\/.*/} | ${'regexp:^\\/api\\/.*'}
    `('return "$expected" when path is "$path"', ({ path, expected }) => {
      expect(serializePath(path)).toStrictEqual(expected);
    });
  });

  describe('deserializePath', () => {
    it.each<{ serializedPath: SerializedPath; expected: Path }>`
      serializedPath           | expected
      ${'string:/api/users'}   | ${'/api/users'}
      ${'regexp:^\\/api\\/.*'} | ${/^\/api\/.*/}
    `(
      'return "$expected" when serializedPath is "$serializedPath"',
      ({ serializedPath, expected }) => {
        expect(deserializePath(serializedPath)).toStrictEqual(expected);
      },
    );

    it('should allow a path that was previously serialized to be deserialized', () => {
      const originalPath: Path = /\/api\/user\/.*/;
      const serializedPath = serializePath(originalPath);
      const deserializedPath = deserializePath(serializedPath);
      expect(deserializedPath).toStrictEqual(originalPath);
    });

    it.each([null, undefined])(
      'should return input value if %s is provided',
      (input) => {
        const possiblyDeserializedPath = deserializePath(input);
        expect(possiblyDeserializedPath).toBe(input);
      },
    );
  });

  describe('getHandlerType', () => {
    it.each(['get', 'post', 'put', 'delete', 'patch'] as const)(
      'should return "http" if a http "%s" handler is provided',
      (method) => {
        const handler = http[method]('abc', successResolver);
        expect(getHandlerType(handler)).toBe('http');
      },
    );
    it.each(['query', 'mutation'] as const)(
      'should return "graphql" if a GraphQL "%s" handler is provided',
      (method) => {
        const handler = graphql[method]('abc', successResolver);
        expect(getHandlerType(handler)).toBe('graphql');
      },
    );
  });

  describe('getHandlerPath', () => {
    it.each<{ path: Path; expected: Path }>`
      path            | expected
      ${'/api/users'} | ${'/api/users'}
      ${/^\/api\/.*/} | ${/^\/api\/.*/}
    `('return "$expected" when path is "$path"', ({ path, expected }) => {
      expect(getHandlerPath(http.get(path, successResolver), {})).toStrictEqual(
        expected,
      );
    });
  });

  describe('getHandlerPath for GraphQL handler', () => {
    it.each<{ path: Path; expected: Path }>`
      path            | expected
      ${'/api/users'} | ${'/api/users'}
      ${/^\/api\/.*/} | ${/^\/api\/.*/}
    `(
      'return "$expected" for graphql.link() with "$path"',
      ({ path, expected }) => {
        expect(
          getHandlerPath(
            graphql
              .link(path)
              .query('Query', () => HttpResponse.json({ data: {} })),
            {},
          ),
        ).toStrictEqual(expected);
      },
    );

    it('return the default endpoint path for graphql handler without link() call', () => {
      const defaultHandler = graphql.query('Query', () =>
        HttpResponse.json({ data: {} }),
      );
      expect(
        getHandlerPath(defaultHandler, {
          graphqlUrl: '/defaultGraphqlEndpoint',
        }),
      ).toStrictEqual('/defaultGraphqlEndpoint');
    });
  });

  describe('convertMswPathToPlaywrightUrl', () => {
    it.each<{ mswPath: string; playwrightUrl: string; expected: boolean }>`
      mswPath                                                   | playwrightUrl                                            | expected
      ${'/graphql'}                                             | ${'/graphql'}                                            | ${true}
      ${'/graphql'}                                             | ${'/graphql?query=GetSettings'}                          | ${true}
      ${'/user/:id'}                                            | ${'/user/1'}                                             | ${true}
      ${'/user/:id'}                                            | ${'/user/1?foo=bar'}                                     | ${true}
      ${'/user/:id'}                                            | ${'/user/1/'}                                            | ${true}
      ${'/user/:id'}                                            | ${'/user/1/?foo=bar'}                                    | ${true}
      ${'/user/:id/friends/:friendId'}                          | ${'/user/1/friends/52'}                                  | ${true}
      ${'/user/:id/friends/:friendId'}                          | ${'/user/1/friends/52?foo=bar'}                          | ${true}
      ${'/user/:id/friends/:friendId?foo=bar'}                  | ${'/user/1/friends/52'}                                  | ${true}
      ${'/user/:id/friends/:friendId/'}                         | ${'/user/1/friends/52/'}                                 | ${true}
      ${'/user/:id/friends/:friendId/'}                         | ${'/user/1/friends/52/?foo=bar'}                         | ${true}
      ${'/user/:id/friends/:friendId/?foo=bar'}                 | ${'/user/1/friends/52/'}                                 | ${true}
      ${'/user/:id'}                                            | ${'/user/1/somethingElse'}                               | ${false}
      ${'/user/:id'}                                            | ${'/user/1/somethingElse?foo=bar'}                       | ${false}
      ${'/user/:id'}                                            | ${'/potato/user/1/somethingElse?foo=bar'}                | ${false}
      ${'/user/:id'}                                            | ${'/potato/user/1/somethingElse'}                        | ${false}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/user/1'}                      | ${true}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/user/1?foo=bar'}              | ${true}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/user/1/'}                     | ${true}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/user/1/?foo=bar'}             | ${true}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/potato/user/1'}               | ${false}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/potato/user/1?foo=bar'}       | ${false}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/potato/user/1/'}              | ${false}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/user/1/potato/?foo=bar'}      | ${false}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/user/1/potato'}               | ${false}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/user/1/potato?foo=bar'}       | ${false}
      ${'/user/:id'}                                            | ${'https://fake.domain.com/user/1/potato/'}              | ${false}
      ${'https://www.google.com.au/potato'}                     | ${'https://www.google.com.au/search?q=potato'}           | ${false}
      ${'https://www.google.com.au/search'}                     | ${'https://www.google.com.au/search?q=potato'}           | ${true}
      ${'https://www.google.com.au/search?foo=bar'}             | ${'https://www.google.com.au/search?q=potato'}           | ${true}
      ${'https://www.google.com.au/:something'}                 | ${'https://www.google.com.au/search?q=potato'}           | ${true}
      ${'https://www.google.com.au/:something/'}                | ${'https://www.google.com.au/search/?q=potato'}          | ${true}
      ${'https://www.google.com.au/:something/?foo=bar'}        | ${'https://www.google.com.au/search/?q=potato'}          | ${true}
      ${'https://www.google.com.au/:potato/:eggplant'}          | ${'https://www.google.com.au/search/something'}          | ${true}
      ${'https://www.google.com.au/:potato/:eggplant'}          | ${'https://www.google.com.au/search/something?foo=bar'}  | ${true}
      ${'https://www.google.com.au/:potato/:eggplant/'}         | ${'https://www.google.com.au/search/something/'}         | ${true}
      ${'https://www.google.com.au/:potato/:eggplant/'}         | ${'https://www.google.com.au/search/something/?foo=bar'} | ${true}
      ${'https://www.google.com.au/:potato/:eggplant?foo=bar'}  | ${'https://www.google.com.au/search/something'}          | ${true}
      ${'https://www.google.com.au/:potato/:eggplant/?foo=bar'} | ${'https://www.google.com.au/search/something/'}         | ${true}
      ${'https://www.google.com.au/*/?foo=bar'}                 | ${'https://www.google.com.au/search/something/?foo=bar'} | ${true}
      ${'https://www.google.com.au/search'}                     | ${'https://different.domain/search'}                     | ${false}
      ${'http://www.google.com.au/:something/'}                 | ${'http://www.google.com.au/search/?q=potato'}           | ${true}
      ${'http://localhost:8080/api/users'}                      | ${'http://localhost:8080/api/users'}                     | ${true}
      ${'http://localhost:8081/api/users'}                      | ${'http://localhost:8080/api/users'}                     | ${false}
      ${'*'}                                                    | ${'http://anything.com/will/match?q=really'}             | ${true}
      ${'http://api.*.foo.com/life/power'}                      | ${'http://api.dev.foo.com/life/power'}                   | ${true}
      ${'http://*.foo.com/life/power'}                          | ${'http://api.dev.foo.com/life/power'}                   | ${true}
      ${'http://b.co/api/*/*'}                                  | ${'http://b.co/api/users/foo'}                           | ${true}
      ${'http://b.co/p/https%3A%2F%2Fa.*%2F*%2Fsecond'}         | ${'http://b.co/p/https%3A%2F%2Fa.co%2Ffirst%2Fsecond'}   | ${true}
      ${'*/api/users'}                                          | ${'http://localhost:8080/api/users'}                     | ${true}
      ${'*/*/users'}                                            | ${'http://localhost:8080/api/users'}                     | ${true}
    `(
      '$expected: "$mswPath" should match "$playwrightUrl"',
      ({ mswPath, playwrightUrl, expected }) => {
        const regex = convertMswPathToPlaywrightUrl(mswPath);
        expect(regex.test(playwrightUrl)).toBe(expected);
      },
    );
  });
});
