export type Settings = {
  enableNotifications: boolean;
  profileVisibility: 'public' | 'private';
};

export type SettingsQueryData = {
  settings: Settings;
};

export type SettingsMutationData = {
  mutateSettings: Settings;
};
export type SettingsMutationVariables = Partial<Settings>;
