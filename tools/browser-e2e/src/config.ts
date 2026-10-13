// Shared configuration for the serve and tunnel scripts and the Playwright suite.
// Values come from the shell first, then from tools/browser-e2e/.env.
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const REPO_ROOT = resolve(PACKAGE_DIR, '../..')
export const RESULTS_DIR = resolve(PACKAGE_DIR, 'results')

const envFile = resolve(PACKAGE_DIR, '.env')
// loadEnvFile never overrides variables that are already set in the shell.
if (existsSync(envFile)) process.loadEnvFile(envFile)

const env = (key: string): string => process.env[key]?.trim() ?? ''
const port = (key: string, fallback: number): number => Number(env(key)) || fallback

// Away from the repo's dev defaults (playground 3000, backend 3002, docs 5173).
export const PORTS = {
  docs: port('E2E_DOCS_PORT', 4310),
  playground: port('E2E_PLAYGROUND_PORT', 4311),
  backend: port('E2E_BACKEND_PORT', 4312)
}

const trimSlash = (url: string): string => url.replace(/\/+$/, '')

export const config = {
  secretKey: env('STRIPE_SECRET_KEY'),
  publishableKey: env('STRIPE_PUBLISHABLE_KEY'),
  pricingTableId: env('PRICING_TABLE_ID'),
  docsUrl: trimSlash(env('DOCS_URL') || `http://localhost:${PORTS.docs}`),
  playgroundUrl: trimSlash(env('PLAYGROUND_URL') || `http://localhost:${PORTS.playground}`),
  backendUrl: `http://localhost:${PORTS.backend}`,
  chromeProfileDir: env('CHROME_PROFILE_DIR'),
  executablePath: env('PW_EXECUTABLE_PATH'),
  interactive: env('E2E_INTERACTIVE') === '1',
  issuing: env('ISSUING') === '1'
}

/** Fails fast with a readable message when a required key is missing. */
export function requireKeys(...keys: Array<'secretKey' | 'publishableKey'>): void {
  const names = { secretKey: 'STRIPE_SECRET_KEY', publishableKey: 'STRIPE_PUBLISHABLE_KEY' }
  const missing = keys.filter((key) => !config[key]).map((key) => names[key])
  if (missing.length) {
    throw new Error(
      `[browser-e2e] Missing ${missing.join(', ')}. Copy .env.example to .env in tools/browser-e2e and fill it in.`
    )
  }
  if (config.secretKey && !/^(sk|rk)_test_/.test(config.secretKey)) {
    throw new Error('[browser-e2e] STRIPE_SECRET_KEY must be a test-mode key (sk_test_...).')
  }
  if (config.publishableKey && !config.publishableKey.startsWith('pk_test_')) {
    throw new Error('[browser-e2e] STRIPE_PUBLISHABLE_KEY must be a test-mode key (pk_test_...).')
  }
}
