// HTTPS for the wallet tests: opens a Cloudflare quick tunnel to the local docs and to the
// playground, registers each tunnel hostname as a Stripe payment method domain (test mode),
// and prints the URLs to put in .env as DOCS_URL and PLAYGROUND_URL.
//
//   pnpm --filter @vue-stripe/browser-e2e e2e:tunnel
//
// Needs cloudflared (brew install cloudflared, or the .deb / .rpm from Cloudflare). Quick
// tunnels get a new hostname on every run, so each run registers new domains; Ctrl+C
// disables the domains this run registered. A stable hostname (a named Cloudflare tunnel or
// your own domain) registered once is better for regular use: see README.
import { spawn, type ChildProcess } from 'node:child_process'
import Stripe from 'stripe'
import { config, PORTS, requireKeys } from '../src/config.ts'

const log = (line: string): boolean => process.stdout.write(`[browser-e2e] ${line}\n`)

const tunnels: ChildProcess[] = []
const registered: string[] = []
let stripe: Stripe | null = null

/** Starts `cloudflared tunnel --url` and resolves with the https://*.trycloudflare.com URL. */
function startTunnel(port: number): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      'cloudflared',
      ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${port}`],
      {
        stdio: ['ignore', 'pipe', 'pipe']
      }
    )
    tunnels.push(child)
    const timer = setTimeout(
      () => reject(new Error(`cloudflared gave no URL for port ${port}`)),
      60_000
    )
    const onData = (chunk: Buffer): void => {
      const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(chunk.toString())
      if (match) {
        clearTimeout(timer)
        resolvePromise(match[0])
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      reject(
        error.code === 'ENOENT'
          ? new Error('cloudflared is not installed: brew install cloudflared (see README)')
          : error
      )
    })
    child.on('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`cloudflared exited (${code}) before printing a URL`))
    })
  })
}

/** Registers (or re-enables) the hostname as a payment method domain and reports wallet status. */
async function registerDomain(client: Stripe, url: string): Promise<string> {
  const domainName = new URL(url).hostname
  const existing = (await client.paymentMethodDomains.list({ domain_name: domainName, limit: 1 }))
    .data[0]
  const domain = existing
    ? await client.paymentMethodDomains.update(existing.id, { enabled: true })
    : await client.paymentMethodDomains.create({ domain_name: domainName, enabled: true })
  if (!existing) registered.push(domain.id)
  return [
    `apple_pay ${domain.apple_pay.status}`,
    `google_pay ${domain.google_pay.status}`,
    `link ${domain.link.status}`
  ].join(', ')
}

async function shutdown(code = 0): Promise<never> {
  for (const tunnel of tunnels) tunnel.kill('SIGTERM')
  if (stripe && registered.length) {
    log(`Disabling ${registered.length} payment method domain(s) this run registered...`)
    await Promise.allSettled(
      registered.map((id) => stripe?.paymentMethodDomains.update(id, { enabled: false }))
    )
  }
  process.exit(code)
}

async function main(): Promise<void> {
  requireKeys('secretKey')
  stripe = new Stripe(config.secretKey)

  const [docsUrl, playgroundUrl] = await Promise.all([
    startTunnel(PORTS.docs),
    startTunnel(PORTS.playground)
  ])
  const [docsStatus, playgroundStatus] = await Promise.all([
    registerDomain(stripe, docsUrl),
    registerDomain(stripe, playgroundUrl)
  ])

  log(`docs        ${docsUrl}  (${docsStatus})`)
  log(`playground  ${playgroundUrl}  (${playgroundStatus})`)
  log('Put these in tools/browser-e2e/.env (no rebuild needed), with e2e:serve running:')
  process.stdout.write(`\nDOCS_URL=${docsUrl}\nPLAYGROUND_URL=${playgroundUrl}\n\n`)
  log('Quick tunnels can take a minute to resolve in DNS. Press Ctrl+C to stop the tunnels.')
}

process.on('SIGINT', () => void shutdown(0))
process.on('SIGTERM', () => void shutdown(0))

main().catch((error: unknown) => {
  process.stderr.write(`[browser-e2e] ${error instanceof Error ? error.message : String(error)}\n`)
  void shutdown(1)
})
