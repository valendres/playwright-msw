import { FC, useCallback, FormEvent } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  SettingsQueryData,
  SettingsMutationVariables,
} from '../types/settings';

const GET_SETTINGS = gql`
  query GetSettings {
    settings {
      enableNotifications
      profileVisibility
    }
  }
`;

const MUTATE_SETTINGS = gql`
  mutation MutateSettings(
    $enableNotifications: Boolean!
    $profileVisibility: String!
  ) {
    mutateSettings(
      enableNotifications: $enableNotifications
      profileVisibility: $profileVisibility
    ) {
      enableNotifications
      profileVisibility
    }
  }
`;

export const SettingsForm: FC = () => {
  const settingsQuery = useQuery<SettingsQueryData>(GET_SETTINGS);
  const [settingsMutation, settingsMutationMeta] = useMutation<
    null,
    SettingsMutationVariables
  >(MUTATE_SETTINGS);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    settingsMutation({
      variables: {
        enableNotifications: false,
        profileVisibility: 'public',
      },
    });
  }, []);
  return (
    <div>
      <h1>Settings</h1>
      {settingsQuery.loading ? (
        'Loading...'
      ) : settingsQuery.error ? (
        <div>Failed to load settings</div>
      ) : (
        <form onSubmit={handleFormSubmit}>
          <div>
            <label htmlFor="enableNotifications">Notifications</label>
            <input
              type="checkbox"
              id="enableNotifications"
              name="enableNotifications"
              defaultChecked={settingsQuery.data?.settings.enableNotifications}
            />
          </div>
          <div>
            <label htmlFor="profileVisibility">Profile visibility</label>
            <select
              id="profileVisibility"
              name="profileVisibility"
              defaultValue={settingsQuery.data?.settings.profileVisibility}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <button type="submit">Update</button>
        </form>
      )}
      {settingsMutationMeta.called && (
        <div>
          <br />
          <div role="alert">
            {settingsMutationMeta.error
              ? 'Failed to update settings'
              : 'Successfully updated settings!'}
          </div>
        </div>
      )}
    </div>
  );
};
