import documentsHandlers from './handlers/documents';
import sessionHandlers from './handlers/session';
import usersHandlers from './handlers/users';
import settingsHandlers from './handlers/settings';

export default [
  ...documentsHandlers,
  ...sessionHandlers,
  ...usersHandlers,
  ...settingsHandlers,
];
