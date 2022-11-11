import { Path, RequestHandler, RestHandler } from 'msw';
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

export const getHandlerType = (handler: RequestHandler): 'rest' | 'graphql' =>
  'path' in handler.info ? 'rest' : 'graphql';

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
  return (<RestHandler>handler).info.path;
};

export const convertMswPathToPlaywrightUrl = (path: Path): string | RegExp => {
  if (path instanceof RegExp) {
    return path;
  }
  const transformedPath = path.replace(/\/:[^/]+/g, '/*').replace(/\?.+/, '');
  return transformedPath.endsWith('*')
    ? transformedPath
    : `${transformedPath}*`;
};
