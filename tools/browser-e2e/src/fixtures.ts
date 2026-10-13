// Shared fixtures: a console and page-error guard on every test, a screenshot helper for the
// key step, and a server-side Stripe client to verify outcomes through the API.
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { test as base, expect, type Page, type TestInfo } from '@playwright/test'
import Stripe from 'stripe'
import { config, RESULTS_DIR } from './config.ts'

interface ConsoleEntry {
  kind: 'console.error' | 'console.warn' | 'pageerror'
  text: string
}

// Stripe.js's own test-mode notices are not failures.
const IGNORED: RegExp[] = [
  // "You may test your Stripe.js integration over HTTP. However, live Stripe.js integrations
  // must use HTTPS."
  /integration over HTTP/i,
  /must use HTTPS/i,
  // The developer-tools banner Stripe.js prints in test mode.
  /Stripe developer tools/i,
  // Apple Pay / wallet domain verification notices.
  /Apple Pay/i,
  /apple-developer-merchantid-domain-association/i,
  /register(ed)? (your|this) domain/i
]

const isIgnored = (text: string): boolean => IGNORED.some((pattern) => pattern.test(text))

/** A failure is a `[Vue Stripe]` message or an uncaught exception that is not a Stripe notice. */
const isFailure = (entry: ConsoleEntry): boolean =>
  !isIgnored(entry.text) && (entry.kind === 'pageerror' || entry.text.includes('[Vue Stripe]'))

function watchConsole(page: Page, entries: ConsoleEntry[]): void {
  page.on('console', (message) => {
    const type = message.type()
    if (type === 'error' || type === 'warning') {
      entries.push({
        kind: type === 'error' ? 'console.error' : 'console.warn',
        text: message.text()
      })
    }
  })
  page.on('pageerror', (error) => entries.push({ kind: 'pageerror', text: String(error) }))
}

const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

/** Screenshot of the key step, attached to the report and copied to results/screenshots. */
export async function snap(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const dir = resolve(RESULTS_DIR, 'screenshots')
  mkdirSync(dir, { recursive: true })
  const file = resolve(
    dir,
    `${testInfo.project.name}-${slug(testInfo.titlePath.slice(1).join(' '))}-${slug(name)}.png`
  )
  await page.screenshot({ path: file, fullPage: false })
  await testInfo.attach(name, { path: file, contentType: 'image/png' })
}

interface Fixtures {
  consoleGuard: ConsoleEntry[]
  snap: (name: string, page?: Page) => Promise<void>
}

interface WorkerFixtures {
  stripe: Stripe
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  stripe: [
    // eslint-disable-next-line no-empty-pattern -- Playwright requires the destructuring here
    async ({}, use) => {
      await use(new Stripe(config.secretKey, { maxNetworkRetries: 2 }))
    },
    { scope: 'worker' }
  ],

  consoleGuard: [
    async ({ page }, use, testInfo) => {
      const entries: ConsoleEntry[] = []
      const version = page.context().browser()?.version()
      if (version) testInfo.annotations.push({ type: 'browser', description: version })
      watchConsole(page, entries)
      page.context().on('page', (popup) => watchConsole(popup, entries))
      await use(entries)

      if (entries.length) {
        await testInfo.attach('console.txt', {
          body: entries.map((entry) => `${entry.kind}: ${entry.text}`).join('\n'),
          contentType: 'text/plain'
        })
      }
      const failures = entries.filter(isFailure)
      if (testInfo.status === 'passed' && failures.length) {
        expect(
          failures.map((entry) => `${entry.kind}: ${entry.text}`),
          'No [Vue Stripe] errors and no uncaught exceptions'
        ).toEqual([])
      }
    },
    { auto: true }
  ],

  snap: async ({ page }, use, testInfo) => {
    await use((name, target = page) => snap(target, testInfo, name))
  }
})

export { expect }
