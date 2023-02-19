import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import { resolve } from 'path';

const playwrightDir = (partialPath: string) =>
  resolve(__dirname, './tests/playwright', partialPath);

const WEB_SERVER_PORT = 4173;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: playwrightDir('./specs'),
  outputDir: playwrightDir('./results'),
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 10000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [
      'html',
      {
        outputFolder: playwrightDir('./report'),
        open: process.env.CI ? 'never' : 'on-failure',
      },
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,

    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://localhost:${WEB_SERVER_PORT}/`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: `yarn preview --port ${WEB_SERVER_PORT}`,
    port: WEB_SERVER_PORT,
    reuseExistingServer: !process.env.CI,
  },
};

export default config;
