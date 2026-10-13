// One-command local stack for the browser suite: builds the library, the backend, the docs
// and the playground with the keys from .env, then serves all three.
//
//   pnpm --filter @vue-stripe/browser-e2e e2e:serve            build, then serve
//   pnpm --filter @vue-stripe/browser-e2e e2e:serve --no-build  serve the last build
import { spawn, type ChildProcess } from 'node:child_process'
import type { Server } from 'node:http'
import { resolve } from 'node:path'
import { config, PORTS, REPO_ROOT, requireKeys } from '../src/config.ts'
import { startStaticServer } from '../src/static-server.ts'

const log = (line: string): boolean => process.stdout.write(`[browser-e2e] ${line}\n`)

const children: ChildProcess[] = []
const servers: Server[] = []

function run(command: string, args: string[], env: NodeJS.ProcessEnv = {}): Promise<void> {
  log(`$ ${command} ${args.join(' ')}`)
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: { ...process.env, ...env }
    })
    child.on('exit', (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`${command} ${args.join(' ')} exited ${code}`))
    )
  })
}

async function waitFor(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function shutdown(code = 0): never {
  for (const child of children) child.kill('SIGTERM')
  for (const server of servers) server.close()
  process.exit(code)
}

async function main(): Promise<void> {
  requireKeys('secretKey', 'publishableKey')

  // VITE_API_URL '/.' turns `${apiUrl}/api/x` into '/./api/x', a path on the page's own
  // origin, which the static server proxies to the backend. One build then works on
  // localhost and behind any HTTPS tunnel, with no mixed content and no CORS.
  const apiUrl = '/.'
  const backendEnv = {
    STRIPE_SECRET_KEY: config.secretKey,
    NEXT_PUBLIC_FRONTEND_URL: config.playgroundUrl
  }

  if (!process.argv.includes('--no-build')) {
    await run('pnpm', ['--filter', '@vue-stripe/vue-stripe', 'build'])
    await run('pnpm', ['--filter', '@vue-stripe/backend', 'build'], backendEnv)
    await run('pnpm', ['--filter', '@vue-stripe/docs', 'build'], {
      VITE_STRIPE_PUBLISHABLE_KEY: config.publishableKey,
      VITE_API_URL: apiUrl
    })
    await run('pnpm', ['--filter', '@vue-stripe/playground', 'build'], { VITE_API_URL: apiUrl })
  }

  // The next binary directly (not through pnpm exec), so stopping this script stops it.
  const backendDir = resolve(REPO_ROOT, 'apps/backend')
  const backend = spawn(
    resolve(backendDir, 'node_modules/.bin/next'),
    ['start', '-H', '127.0.0.1', '-p', String(PORTS.backend)],
    { cwd: backendDir, stdio: 'inherit', env: { ...process.env, ...backendEnv } }
  )
  children.push(backend)
  backend.on('exit', (code) => {
    log(`backend exited (${code})`)
    shutdown(code ?? 1)
  })

  servers.push(
    await startStaticServer({
      root: resolve(REPO_ROOT, 'apps/docs/.vitepress/dist'),
      port: PORTS.docs,
      backendPort: PORTS.backend,
      fallback: '404'
    }),
    await startStaticServer({
      root: resolve(REPO_ROOT, 'apps/playground/dist'),
      port: PORTS.playground,
      backendPort: PORTS.backend,
      fallback: 'spa'
    })
  )

  await waitFor(`http://127.0.0.1:${PORTS.backend}/api/payment-intent`)

  log('Ready. Leave this running and start the suite in another terminal.')
  log(`  docs        http://localhost:${PORTS.docs}  (tests use ${config.docsUrl})`)
  log(`  playground  http://localhost:${PORTS.playground}  (tests use ${config.playgroundUrl})`)
  log(`  backend     http://localhost:${PORTS.backend}`)
  log('Press Ctrl+C to stop.')
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

main().catch((error: unknown) => {
  process.stderr.write(`[browser-e2e] ${error instanceof Error ? error.message : String(error)}\n`)
  shutdown(1)
})
