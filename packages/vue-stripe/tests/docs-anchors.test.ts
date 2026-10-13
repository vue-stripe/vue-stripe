import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * VitePress fails the build on a link to a missing page, but not on a link to a missing
 * heading. Docs pages deep-link each other's sections (`/guide/testing#cards`), so moving
 * or renaming a heading silently breaks those links. This test resolves every internal
 * `#anchor` link in apps/docs against the headings (and explicit ids) of its target page.
 */
const docsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/docs')

// VitePress's default heading slug (@mdit-vue/shared slugify), applied to the heading text.
const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    // eslint-disable-next-line no-control-regex -- same control-character strip as VitePress
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()

const markdownFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name === 'node_modules' || name.startsWith('.')) return []
    if (statSync(path).isDirectory()) return markdownFiles(path)
    return name.endsWith('.md') ? [path] : []
  })

// Lines outside fenced code blocks, where links and headings are real markdown.
const proseLines = (source: string) => {
  let fence: string | null = null
  return source.split('\n').filter((line) => {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (marker) {
      if (fence === null) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null
      return false
    }
    return fence === null
  })
}

const anchorsCache = new Map<string, Set<string>>()
const anchorsOf = (file: string): Set<string> => {
  const cached = anchorsCache.get(file)
  if (cached) return cached
  const source = readFileSync(file, 'utf8')
  const anchors = new Set<string>()
  const seen = new Map<string, number>()
  for (const line of proseLines(source)) {
    const heading = /^#{1,6}\s+(.*)$/.exec(line)?.[1]
    if (heading === undefined) continue
    const custom = /\s*\{#([^}]+)\}\s*$/.exec(heading)
    if (custom) {
      anchors.add(custom[1]!)
      continue
    }
    const text = heading
      .replace(/<[^>]+>/g, '') // inline HTML and components such as <DocIcon />
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links keep their text
      .trim()
    const slug = slugify(text)
    const count = seen.get(slug) ?? 0
    seen.set(slug, count + 1)
    anchors.add(count === 0 ? slug : `${slug}-${count}`)
  }
  for (const match of source.matchAll(/\bid="([^"]+)"/g)) anchors.add(match[1]!)
  anchorsCache.set(file, anchors)
  return anchors
}

// The .md file a link path opens, or null for a path outside the markdown pages.
const targetFile = (from: string, path: string): string | null => {
  const clean = path.replace(/\.(html|md)$/, '')
  const base = clean.startsWith('/') ? join(docsDir, clean) : resolve(dirname(from), clean)
  const candidates =
    clean.endsWith('/') || clean === ''
      ? [join(base, 'index.md')]
      : [`${base}.md`, join(base, 'index.md')]
  return candidates.find((c) => existsSync(c)) ?? null
}

const links = markdownFiles(docsDir).flatMap((file) =>
  proseLines(readFileSync(file, 'utf8')).flatMap((line) =>
    [...line.matchAll(/\]\(([^)\s]*#[^)\s]+)\)|href="([^"]*#[^"]+)"/g)]
      .map((m) => (m[1] ?? m[2])!)
      .filter((href) => !/^[a-z]+:/i.test(href))
      .map((href) => {
        const [path = '', anchor = ''] = href.split('#')
        return { file, href, path, anchor: decodeURIComponent(anchor) }
      })
  )
)

describe('docs deep links', () => {
  it('finds deep links to check', () => {
    expect(links.length).toBeGreaterThan(50)
  })

  it.each(links.map((l) => [relative(docsDir, l.file), l.href, l] as const))(
    '%s -> %s resolves to a heading',
    (_file, href, link) => {
      const target = link.path === '' ? link.file : targetFile(link.file, link.path)
      expect(target, `${href}: no such page`).not.toBeNull()
      expect([...anchorsOf(target!)], `${href}: no heading with this anchor`).toContain(link.anchor)
    }
  )
})
