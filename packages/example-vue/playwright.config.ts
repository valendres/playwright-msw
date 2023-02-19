import { PlaywrightTestConfig } from '@playwright/test';
import { resolve } from 'path';

const WEB_SERVER_PORT = 4173;

const testDir = (partialPath?: string) =>
  resolve(__dirname, './test', partialPath);

const config: PlaywrightTestConfig = {
  testDir: testDir('./specs'),
  outputDir: testDir('./results'),
  timeout: 30 * 1000,
  expect: {
    timeout: 10000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [
      'html',
      {
        outputFolder: testDir('./report'),
        open: process.env.CI ? 'never' : 'on-failure',
      },
    ],
  ],
  use: {
    baseURL: `http://localhost:${WEB_SERVER_PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build-only && npm run preview',
    url: `http://localhost:${WEB_SERVER_PORT}`,
    timeout: 10000,
  },
};
export default config;
