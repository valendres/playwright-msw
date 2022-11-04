/* istanbul ignore file */
import { jest } from "@jest/globals";
import { Page, Route, Request } from "@playwright/test";
import { RouteUrl, RouteHandler } from "../src/router";

export const mockPage = (overrides: Partial<Page> = {}): Page => {
  const page: Partial<Page> = {
    route: jest
      .fn<(url: RouteUrl, handler: RouteHandler) => Promise<void>>()
      .mockResolvedValue(undefined),
    unroute: jest
      .fn<(url: RouteUrl, handler: RouteHandler) => Promise<void>>()
      .mockResolvedValue(undefined),
    ...overrides,
  };
  return page as Page;
};

export const mockRoute = (overrides: Partial<Route> = {}): Route => {
  const route: Partial<Route> = {
    ...overrides,
  };
  return route as Route;
};

export const mockRequest = (overrides: Partial<Request> = {}): Request => {
  const request: Partial<Request> = {
    ...overrides,
  };
  return request as Request;
};
