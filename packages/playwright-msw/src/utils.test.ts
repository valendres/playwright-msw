import {
  getHandlerPath,
  getHandlerType,
  serializePath,
  SerializedPath,
  deserializePath,
} from './utils';
import { rest, graphql, ResponseResolver, Path } from 'msw';
import { describe, it, expect } from '@jest/globals';
import { convertMswPathToPlaywrightUrl } from './utils';

const successResolver: ResponseResolver = (_, response, context) =>
  response(context.status(200));

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
      }
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
      }
    );
  });

  describe('getHandlerType', () => {
    it.each(['get', 'post', 'put', 'delete', 'patch'] as const)(
      'should return "rest" if a REST "%s" handler is provided',
      (method) => {
        const handler = rest[method]('abc', successResolver);
        expect(getHandlerType(handler)).toBe('rest');
      }
    );
    it.each(['query', 'mutation'] as const)(
      'should return "graphql" if a GraphQL "%s" handler is provided',
      (method) => {
        const handler = graphql[method]('abc', successResolver);
        expect(getHandlerType(handler)).toBe('graphql');
      }
    );
  });

  describe('getHandlerPath', () => {
    it.each<{ path: Path; expected: Path }>`
      path            | expected
      ${'/api/users'} | ${'/api/users'}
      ${/^\/api\/.*/} | ${/^\/api\/.*/}
    `('return "$expected" when path is "$path"', ({ path, expected }) => {
      expect(getHandlerPath(rest.get(path, successResolver), {})).toStrictEqual(
        expected
      );
    });
  });

  describe('convertMswPathToPlaywrightUrl', () => {
    it.each([
      [
        'should return a regex without modifying it',
        {
          path: /^\/api\/.*/,
          expected: /^\/api\/.*/,
        },
      ],
      [
        'should replace a single route parameter with a wildcard if provided',
        {
          path: '/users/:userId',
          expected: '/users/*',
        },
      ],
      [
        'should return path with wildcard on the end even if there are no route parameters',
        {
          path: '/users/123',
          expected: '/users/123*',
        },
      ],
      [
        'should replace multiple sequential route parameters if provided',
        {
          path: '/users/:userId/:something',
          expected: '/users/*/*',
        },
      ],
      [
        'should replace multiple disjointed route parameters if provided',
        {
          path: '/users/:userId/photos/:photoId',
          expected: '/users/*/photos/*',
        },
      ],
      [
        'should drop query parameters',
        {
          path: '/users/:userId/photos/:photoId?potato=123',
          expected: '/users/*/photos/*',
        },
      ],
      [
        'should add a wildcard on the end so that query parameters can be matched',
        {
          path: '/api/v1/documents/?potato=123',
          expected: '/api/v1/documents/*',
        },
      ],
    ])('%s', (_, { path, expected }) => {
      expect(convertMswPathToPlaywrightUrl(path)).toStrictEqual(expected);
    });
  });
});
