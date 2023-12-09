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
  config: Config,
): Path => {
  if (getHandlerType(handler) === 'graphql') {
    const { graphqlUrl } = config;
    if (!graphqlUrl) {
      throw new Error(
        'Missing "graphqlUrl". This is required to be able to use GraphQL handlers. Please provide it when calling "createWorkerFixture".',
      );
    }
    return graphqlUrl;
  }
  // TODO: use correct type
  return (handler.info as unknown as { path: string }).path;
};

const getOriginRegex = (origin: string) => {
  if (origin === '*') {
    return '.*';
  }
  return (
    (origin ?? '')
      // escape dots in domains, for more exact matches
      .replace(/\./, '.')
      // support wildcard star matches
      .replace('*', '.*') || '(\\w+://[^/]+)?'
  );
};

export const convertMswPathToPlaywrightUrl = (path: Path): RegExp => {
  // If already a regex, just return straight away
  if (path instanceof RegExp) {
    return path;
  }

  // A route that matches everything for testing
  if (path === '*') {
    return /.*/;
  }

  // Deconstruct path
  const { origin, pathname } =
    path.match(
      /^(?<origin>\*|\w+:\/\/[^/]+)?(?<pathname>[^?]+)(?<search>\?.*)?/,
    )?.groups ?? {};

  // Rebuild it as a RegExp
  return new RegExp(
    [
      '^',
      getOriginRegex(origin),
      pathname
        // support star matching
        .replace(/\*/g, '.*')
        // Replace route parameters (`:whatever`) with multi-char wildcard
        .replace(/:[^/]+/g, '[^/]+'),
      // Add optional trailing slash
      '\\/?',
      // Add optional query parameters
      '(\\?.*)?',
      // Anchor to end of string
      '$',
    ].join(''),
  );
};

export function objectifyHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => (result[key] = value));
  return result;
}

export async function readableStreamToBuffer(
  contentType: string | undefined,
  body: ReadableStream<Uint8Array> | null,
): Promise<string | Buffer | undefined> {
  if (!body) return undefined;

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const { value, done: readDone } = await reader.read();
    if (value) {
      chunks.push(value);
    }
    done = readDone;
  }

  // Calculate the total length of all chunks
  const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);

  // Combine the chunks into a single Uint8Array
  const combinedChunks = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combinedChunks.set(chunk, offset);
    offset += chunk.length;
  }

  if (contentType?.includes('application/json')) {
    return new TextDecoder().decode(combinedChunks);
  } else if (contentType?.includes('text')) {
    return new TextDecoder().decode(combinedChunks);
  } else {
    // For binary data, return as Buffer
    return Buffer.from(combinedChunks);
  }
}
