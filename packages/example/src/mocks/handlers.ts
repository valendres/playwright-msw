import sessionHandlers from './handlers/session';
import usersHandlers from './handlers/users';
import settingsHandlers from './handlers/settings';

export default [...sessionHandlers, ...usersHandlers, ...settingsHandlers];
