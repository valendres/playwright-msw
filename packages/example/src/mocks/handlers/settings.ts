import { graphql, HttpResponse } from 'msw';
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
  graphql.query<SettingsQueryData>('GetSettings', () =>
    HttpResponse.json({
      data: {
        settings: DEFAULT_SETTINGS,
      },
    }),
  ),
  graphql.mutation<SettingsMutationData, SettingsMutationVariables>(
    'MutateSettings',
    ({ variables }) =>
      HttpResponse.json({
        data: { mutateSettings: { ...DEFAULT_SETTINGS, ...variables } },
      }),
  ),
];
