import { graphql } from 'msw';
import { SettingsForm } from '../models/settings-form';
import { test } from '../test';

test.describe.parallel('GraphQL example: user settings', () => {
  test('should utilize the initial GraphQL query mocks without any overrides being specified', async ({
    page,
  }) => {
    await page.goto('/settings');

    const settingsForm = new SettingsForm(page);
    await settingsForm.assertNotificationsEnabled(true);
    await settingsForm.assertProfileVisibility('private');
  });

  test('should allow a GraphQL query to be overridden on a per-test basis', async ({
    page,
    worker,
  }) => {
    await worker.use(
      graphql.query('GetSettings', (_, response, context) =>
        response(context.status(500))
      )
    );
    await page.goto('/settings');

    const settingsForm = new SettingsForm(page);
    await settingsForm.assertError(SettingsForm.Error.QueryFailed);
  });

  test('should utilize the initial GraphQL mutation mocks without any overrides being specified', async ({
    page,
  }) => {
    await page.goto('/settings');

    const settingsForm = new SettingsForm(page);
    await settingsForm.setNotificationsEnabled(false);
    await settingsForm.submit();
    await settingsForm.assertSuccessful();
  });

  test('should allow a GraphQL mutation to be overridden on a per-test basis', async ({
    page,
    worker,
  }) => {
    await worker.use(
      graphql.mutation('MutateSettings', (_, response, context) =>
        response(context.status(500))
      )
    );
    await page.goto('/settings');

    const settingsForm = new SettingsForm(page);
    await settingsForm.setNotificationsEnabled(false);
    await settingsForm.submit();
    await settingsForm.assertError(SettingsForm.Error.MutationFailed);
  });
});
