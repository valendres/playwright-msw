import { graphql } from 'msw';
import { Settings } from '../../types/settings';
import {
  SettingsMutationData,
  SettingsMutationVariables,
  SettingsQueryData,
} from '../../types/settings';

const DEFAULT_SETTINGS: Settings = {
  enableNotifications: true,
  profileVisibility: 'private',
};

export default [
  graphql.query<SettingsQueryData>('GetSettings', (_, response, context) =>
    response(
      context.status(200),
      context.data({
        settings: DEFAULT_SETTINGS,
      })
    )
  ),
  graphql.mutation<SettingsMutationData, SettingsMutationVariables>(
    'MutateSettings',
    (request, response, context) =>
      response(
        context.status(200),
        context.data({
          mutateSettings: { ...DEFAULT_SETTINGS, ...request.variables },
        })
      )
  ),
];
