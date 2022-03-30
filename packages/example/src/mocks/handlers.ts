import { rest } from "msw";

export const handlers = [
  rest.get("/api/user/profile", (_, response, context) =>
    response(
      context.delay(250),
      context.status(200),
      context.json({
        firstName: "Joe",
        lastName: "Smith",
        favVegetable: "🍆",
      })
    )
  ),
];
