import documentsHandlers from './handlers/documents';
import searchHandlers from './handlers/search';
import sessionHandlers from './handlers/session';
import usersHandlers from './handlers/users';
import settingsHandlers from './handlers/settings';

export default [
  ...documentsHandlers,
  ...searchHandlers,
  ...sessionHandlers,
  ...usersHandlers,
  ...settingsHandlers,
];
