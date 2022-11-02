import { RequestHandler, RestHandler } from "msw";

export const getHandlerType = (handler: RequestHandler): "rest" | "graphql" =>
  "path" in handler.info ? "rest" : "graphql";

export const getHandlerUrl = (handler: RequestHandler): string =>
  getHandlerType(handler) === "rest"
    ? (handler as RestHandler).info.path.toString()
    : "";
