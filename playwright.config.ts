import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4320',
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH || undefined,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  webServer: {
    command: 'npx serve out -l 4320',
    url: 'http://localhost:4320',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'masaustu', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobil', use: { ...devices['Pixel 7'] } },
  ],
});
