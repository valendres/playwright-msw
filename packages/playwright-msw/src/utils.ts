import { RequestHandler, RestHandler } from "msw";

export const isRestHandler = (handler: RequestHandler): boolean =>
  "path" in handler.info;

export const getHandlerUrl = (handler: RequestHandler): string | RegExp =>
  isRestHandler(handler) ? (handler as RestHandler).info.path : "";
