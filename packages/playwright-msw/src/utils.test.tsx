import { getHandlerUrl } from "./utils";

describe("utils", () => {
  describe("convertMswPathToPlaywrightRoute", () => {
    test.concurrent.each`
      path            | expected
      ${"/api/users"} | ${"/api/users"}
    `("return $expected when path is $path", ({ path, expected }) => {
      expect(getHandlerUrl(path)).toStrictEqual(expected);
    });
  });
});
