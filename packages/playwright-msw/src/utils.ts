import { Path, RequestHandler, RestHandler } from "msw";

export type SerializedPathType = "regexp" | "string";
export type SerializedPath = `${SerializedPathType}:${string}`;

export const serializePath = (path: Path): SerializedPath =>
  path instanceof RegExp ? `regexp:${path.source}` : `string:${path}`;

export const deserializePath = (serializedPath: SerializedPath): Path => {
  const match = (serializedPath ?? "").match(/(?<type>[^:]+):(?<path>.+)/);

  if (!match) {
    return serializedPath;
  }

  const { type, path } = <{ type: SerializedPathType; path: string }>(
    match.groups
  );
  return type === "regexp" ? new RegExp(path) : path;
};

export const getHandlerType = (handler: RequestHandler): "rest" | "graphql" =>
  "path" in handler.info ? "rest" : "graphql";

export const getHandlerPath = (handler: RequestHandler): Path =>
  getHandlerType(handler) === "rest" ? (handler as RestHandler).info.path : "";
