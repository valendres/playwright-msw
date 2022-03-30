import { rest } from "msw";
import { UsersApiParams, UsersApiResponse } from "../types/api";

export const handlers = [
  rest.get<null, UsersApiParams, UsersApiResponse>(
    "/api/users",
    (_, response, context) =>
      response(
        context.delay(500),
        context.status(200),
        context.json([
          {
            id: "bcff5c0e-10b6-407b-94d1-90d741363885",
            firstName: "Rhydian",
            lastName: "Greig",
          },
          {
            id: "b44e89e4-3254-415e-b14a-441166616b20",
            firstName: "Alessandro",
            lastName: "Metcalfe",
          },
          {
            id: "6e369942-6b5d-4159-9b39-729646549183",
            firstName: "Erika",
            lastName: "Richards",
          },
        ])
      )
  ),
];
