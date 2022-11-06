import { rest } from 'msw';
import {
  GetUsersItemApiParams,
  GetUsersItemApiResponse,
} from '../../types/users';
import {
  GetUsersCollectionApiParams,
  GetUsersCollectionApiResponse,
} from '../../types/users';

const users: GetUsersItemApiResponse[] = [
  {
    id: 'bcff5c0e-10b6-407b-94d1-90d741363885',
    firstName: 'Rhydian',
    lastName: 'Greig',
    dob: '1946-1-8',
    email: 'rhydian.greig@example.com',
    address: '3574 Daisy Dr',
    phoneNumber: '(560) 793-2438',
  },
  {
    id: 'b44e89e4-3254-415e-b14a-441166616b20',
    firstName: 'Alessandro',
    lastName: 'Metcalfe',
    dob: '1945-2-11',
    email: 'alessandro.metcalfe@example.com',
    address: '7669 N Stelling Rd',
    phoneNumber: '(361) 697-8596',
  },
  {
    id: '6e369942-6b5d-4159-9b39-729646549183',
    firstName: 'Erika',
    lastName: 'Richards',
    dob: '1952-2-27',
    email: 'erika.richards@example.com',
    address: '1772 Bruce St',
    phoneNumber: '(420) 279-7234',
  },
];

export default [
  rest.get<null, GetUsersCollectionApiParams, GetUsersCollectionApiResponse>(
    '/api/users',
    (_, response, context) =>
      response(
        context.delay(500),
        context.status(200),
        context.json(
          users.map(({ id, firstName, lastName }) => ({
            id,
            firstName,
            lastName,
          }))
        )
      )
  ),
  rest.get<null, GetUsersItemApiParams, GetUsersItemApiResponse>(
    '/api/users/:userId',
    (request, response, context) => {
      const user = users.find((user) => user.id === request.params.userId);
      return user
        ? response(context.delay(100), context.status(200), context.json(user))
        : response(context.delay(100), context.status(404));
    }
  ),
];
