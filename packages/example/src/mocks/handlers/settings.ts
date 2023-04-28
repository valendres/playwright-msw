import { graphql } from 'msw';
import { Settings } from '../../types/settings';
import {
  SettingsMutationData,
  SettingsMutationVariables,
  SettingsQueryData,
} from '../../types/settings';

export const ENDPOINT1 = 'https://first.endpoint/graphql';
export const ENDPOINT2 = 'https://second.endpoint/graphql';
export const graphql1 = graphql.link(ENDPOINT1);
export const graphql2 = graphql.link(ENDPOINT2);

const DEFAULT_SETTINGS: Settings = {
  enableNotifications: true,
  profileVisibility: 'private',
};

export default [
  graphql1.query<SettingsQueryData>('GetSettings', (_, response, context) =>
    response(
      context.status(200),
      context.data({
        settings: DEFAULT_SETTINGS,
      })
    )
  ),
  graphql1.mutation<SettingsMutationData, SettingsMutationVariables>(
    'MutateSettings',
    (request, response, context) =>
      response(
        context.status(200),
        context.data({
          mutateSettings: { ...DEFAULT_SETTINGS, ...request.variables },
        })
      )
  ),
  graphql2.query<SettingsQueryData>('GetSettings', (_, response, context) => {
    return response(
      context.status(200),
      context.data({
        settings: { enableNotifications: false, profileVisibility: 'public' },
      })
    );
  }),
];
