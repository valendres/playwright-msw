import sessionHandlers from './handlers/session';
import usersHandlers from './handlers/users';

export default [...sessionHandlers, ...usersHandlers];
