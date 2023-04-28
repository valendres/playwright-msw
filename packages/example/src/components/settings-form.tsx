import { FC, useCallback, FormEvent, useState } from 'react';
import {
  useQuery,
  useMutation,
  gql,
  ApolloClient,
  InMemoryCache,
} from '@apollo/client';
import {
  SettingsQueryData,
  SettingsMutationVariables,
} from '../types/settings';
import { ENDPOINT2 } from '../mocks/handlers/settings';

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

const client2 = new ApolloClient({
  uri: ENDPOINT2,
  cache: new InMemoryCache(),
});

export const SettingsForm: FC = () => {
  const settingsQuery = useQuery<SettingsQueryData>(GET_SETTINGS);
  const settingsQueryFromEndpoint2 = useQuery<SettingsQueryData>(GET_SETTINGS, {
    client: client2,
  });
  const [settingsMutation, settingsMutationMeta] = useMutation<
    null,
    SettingsMutationVariables
  >(MUTATE_SETTINGS);

  const [usingEndpoint2, setUsingEndpoint2] = useState(false);

  const settingsQueryResult = usingEndpoint2
    ? settingsQueryFromEndpoint2
    : settingsQuery;

  // For creating a new instance with the newest defaultValue
  const formKey = usingEndpoint2 ? 'endpoint2' : 'endpoint1';

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void settingsMutation({
      variables: {
        enableNotifications: false,
        profileVisibility: 'public',
      },
    });
  }, []);
  return (
    <div>
      <h1>Settings</h1>
      <div style={{ marginBottom: 20 }}>
        <label htmlFor="useEndpoint2">Use Endpoint 2</label>
        <input
          type="checkbox"
          id="useEndpoint2"
          name="useEndpoint2"
          checked={usingEndpoint2}
          onChange={() => setUsingEndpoint2(!usingEndpoint2)}
        />
      </div>
      {settingsQueryResult.loading ? (
        'Loading...'
      ) : settingsQueryResult.error ? (
        <div>Failed to load settings</div>
      ) : (
        <form key={formKey} onSubmit={handleFormSubmit}>
          <div>
            <label htmlFor="enableNotifications">Notifications</label>
            <input
              type="checkbox"
              id="enableNotifications"
              name="enableNotifications"
              defaultChecked={
                settingsQueryResult.data?.settings.enableNotifications
              }
            />
          </div>
          <div>
            <label htmlFor="profileVisibility">Profile visibility</label>
            <select
              id="profileVisibility"
              name="profileVisibility"
              defaultValue={
                settingsQueryResult.data?.settings.profileVisibility
              }
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
