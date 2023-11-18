import { Path, RequestHandler } from 'msw';
import { Config } from './config';

export type SerializedPathType = 'regexp' | 'string';
export type SerializedPath = `${SerializedPathType}:${string}`;

export const serializePath = (path: Path): SerializedPath =>
  path instanceof RegExp ? `regexp:${path.source}` : `string:${path}`;

export const deserializePath = (serializedPath: SerializedPath): Path => {
  const match = (serializedPath ?? '').match(/(?<type>[^:]+):(?<path>.+)/);
  if (!match) {
    return serializedPath;
  }
  const { type, path } = <{ type: SerializedPathType; path: string }>(
    match.groups
  );
  return type === 'regexp' ? new RegExp(path) : path;
};

export const getHandlerType = (handler: RequestHandler): 'http' | 'graphql' =>
  'path' in handler.info ? 'http' : 'graphql';

export const getHandlerPath = (
  handler: RequestHandler,
  config: Config
): Path => {
  if (getHandlerType(handler) === 'graphql') {
    const { graphqlUrl } = config;
    if (!graphqlUrl) {
      throw new Error(
        'Missing "graphqlUrl". This is required to be able to use GraphQL handlers. Please provide it when calling "createWorkerFixture".'
      );
    }
    return graphqlUrl;
  }
  // TODO: use correct type
  return (handler.info as any).path;
};

export const convertMswPathToPlaywrightUrl = (path: Path): RegExp => {
  // If already a regex, just return straight away
  if (path instanceof RegExp) {
    return path;
  }

  // Deconstruct path
  const { origin, pathname } =
    path.match(
      /^(?<origin>\*|\w+:\/\/[^/]+)?(?<pathname>[^?]+)(?<search>\?.*)?/
    )?.groups ?? {};

  // Rebuild it as a RegExp
  return new RegExp(
    [
      '^',
      origin === '*' ? '.*' : origin ?? '(\\w+://[^/]+)?',
      // Replace route parameters (`:whatever`) with multi-char wildcard
      pathname.replace(/:[^/]+/g, '[^/]+'),
      // Add optional trailing slash
      '\\/?',
      // Add optional query parameters
      '(\\?.*)?',
      // Anchor to end of string
      '$',
    ].join('')
  );
};

export const uuidv4 = () => Math.random().toString(16).slice(2);
