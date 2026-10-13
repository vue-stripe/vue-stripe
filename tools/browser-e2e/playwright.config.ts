import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type LaunchOptions } from '@playwright/test'
import { config, RESULTS_DIR } from './src/config.ts'

// `flows` prefers the real Google Chrome (channel: 'chrome') and falls back to Playwright's
// Chromium when Chrome is not installed. PW_EXECUTABLE_PATH pins any Chromium build (CI,
// headless servers).
export function chromeBrowser(): { channel?: string; launchOptions: LaunchOptions } {
  if (config.executablePath) return { launchOptions: { executablePath: config.executablePath } }
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/opt/google/chrome/chrome'
  ]
  if (chromePaths.some((path) => existsSync(path))) return { channel: 'chrome', launchOptions: {} }
  // Playwright's own Chromium (`pnpm exec playwright install chromium`).
  return { launchOptions: {} }
}

const browser = chromeBrowser()

export default defineConfig({
  testDir: './tests',
  outputDir: resolve(RESULTS_DIR, 'artifacts'),
  // Live Stripe round trips: 3D Secure modals, hosted Checkout redirects, bank modals.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: resolve(RESULTS_DIR, 'html'), open: 'never' }],
    ['./src/summary-reporter.ts', { outputFile: resolve(RESULTS_DIR, 'summary.md') }]
  ],
  use: {
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    viewport: { width: 1280, height: 900 }
  },
  projects: [
    {
      name: 'flows',
      testDir: './tests/flows',
      use: {
        ...(browser.channel ? { channel: browser.channel } : {}),
        launchOptions: browser.launchOptions
      }
    },
    {
      name: 'wallets',
      testDir: './tests/wallets',
      // The wallet specs open their own persistent Chrome context (CHROME_PROFILE_DIR).
      use: { launchOptions: browser.launchOptions }
    }
  ]
})
