// A small static file server for the built docs and playground. Requests to /api/* are
// proxied to the local backend, so each site calls its own origin: that works unchanged
// behind an HTTPS tunnel, with no mixed content and no cross-origin calls to localhost.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, request, type Server } from 'node:http'
import { extname, join, normalize } from 'node:path'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
}

interface StaticServerOptions {
  root: string
  port: number
  backendPort: number
  /** `spa`: unknown paths serve index.html (playground); `404`: they serve 404.html (docs). */
  fallback: 'spa' | '404'
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile()
}

/** Resolves a clean URL (`/guide/testing`) to a file, the way VitePress and vite-ssg emit them. */
function resolveFile(root: string, pathname: string): string | null {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const base = join(root, safe)
  const candidates = [base, `${base}.html`, join(base, 'index.html')]
  return candidates.find(isFile) ?? null
}

export function startStaticServer(options: StaticServerOptions): Promise<Server> {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (url.pathname.startsWith('/api/')) {
      const upstream = request(
        {
          host: '127.0.0.1',
          port: options.backendPort,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: `127.0.0.1:${options.backendPort}` }
        },
        (upstreamRes) => {
          res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
          upstreamRes.pipe(res)
        }
      )
      upstream.on('error', (error) => {
        res.writeHead(502, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: `Backend unavailable: ${error.message}` }))
      })
      req.pipe(upstream)
      return
    }

    let file = resolveFile(options.root, url.pathname)
    let status = 200
    // Missing assets (e.g. /_vercel/insights/script.js, which only Vercel serves) are a plain
    // 404, never the HTML fallback a browser would try to run as a script.
    if (!file && extname(url.pathname)) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('Not found')
      return
    }
    if (!file) {
      const fallback = join(options.root, options.fallback === 'spa' ? 'index.html' : '404.html')
      file = isFile(fallback) ? fallback : null
      status = options.fallback === 'spa' ? 200 : 404
    }
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('Not found')
      return
    }
    res.writeHead(status, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store'
    })
    createReadStream(file).pipe(res)
  })

  return new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(options.port, '127.0.0.1', () => resolvePromise(server))
  })
}
