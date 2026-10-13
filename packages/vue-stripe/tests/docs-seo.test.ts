import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Every docs page gets its <meta name="description">, og:description, JSON-LD description
 * and /llms.txt entry from its `description` frontmatter; without one, VitePress falls back
 * to the site-wide description and search engines see one text for every page. This test
 * keeps each page's description present, of a length search results show in full, and
 * unique, and keeps one H1 and a unique title per page.
 */
const docsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/docs')

const DESCRIPTION_MIN = 70
const DESCRIPTION_MAX = 160

const markdownFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name === 'node_modules' || name === 'public' || name.startsWith('.')) return []
    if (statSync(path).isDirectory()) return markdownFiles(path)
    return name.endsWith('.md') ? [path] : []
  })

/** The flat `key: value` frontmatter the docs use; quoted values are unquoted. */
const frontmatter = (source: string): Record<string, string> => {
  const block = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source)?.[1] ?? ''
  const data: Record<string, string> = {}
  for (const line of block.split(/\r?\n/)) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line)
    if (!kv) continue
    data[kv[1]] = kv[2]
      .trim()
      .replace(/^"(.*)"$/, '$1')
      .replace(/^'(.*)'$/, '$1')
  }
  return data
}

/** H1 headings outside fenced code blocks (a `# comment` in a shell block is not one). */
const h1s = (source: string): string[] => {
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
  let fence: string | null = null
  const found: string[] = []
  for (const line of body.split('\n')) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (marker) {
      if (fence === null) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null
      continue
    }
    if (fence === null && /^# /.test(line)) found.push(line.slice(2).trim())
  }
  return found
}

const pages = markdownFiles(docsDir).map((file) => {
  const source = readFileSync(file, 'utf8')
  const data = frontmatter(source)
  const headings = h1s(source)
  return {
    path: relative(docsDir, file),
    description: data.description ?? '',
    // `layout: page` / `home` pages (the home page) render their H1 from a component.
    customLayout: data.layout === 'page' || data.layout === 'home',
    title: data.title ?? headings[0] ?? '',
    headings
  }
})

describe('docs SEO', () => {
  it('finds the docs pages', () => {
    expect(pages.length).toBeGreaterThan(50)
  })

  it('every page has a description of 70 to 160 characters', () => {
    const problems = pages
      .filter(
        (p) => p.description.length < DESCRIPTION_MIN || p.description.length > DESCRIPTION_MAX
      )
      .map((p) =>
        p.description
          ? `${p.path}: description is ${p.description.length} characters`
          : `${p.path}: no description frontmatter`
      )
    expect(problems, problems.join('\n')).toEqual([])
  })

  it('no two pages share a description', () => {
    const byDescription = new Map<string, string[]>()
    for (const p of pages) {
      const key = p.description.toLowerCase()
      byDescription.set(key, [...(byDescription.get(key) ?? []), p.path])
    }
    const duplicates = [...byDescription.values()]
      .filter((paths) => paths.length > 1)
      .map((paths) => paths.join(', '))
    expect(duplicates, duplicates.join('\n')).toEqual([])
  })

  it('no two pages share a title', () => {
    const byTitle = new Map<string, string[]>()
    for (const p of pages) byTitle.set(p.title, [...(byTitle.get(p.title) ?? []), p.path])
    const duplicates = [...byTitle.entries()]
      .filter(([, paths]) => paths.length > 1)
      .map(([title, paths]) => `"${title}": ${paths.join(', ')}`)
    expect(duplicates, duplicates.join('\n')).toEqual([])
  })

  it('every page has exactly one H1', () => {
    const problems = pages
      .filter((p) => !p.customLayout && p.headings.length !== 1)
      .map((p) => `${p.path}: ${p.headings.length} H1 headings`)
    expect(problems, problems.join('\n')).toEqual([])
  })

  it('ignores # lines inside code blocks when counting H1s', () => {
    expect(h1s('---\ntitle: x\n---\n\n# Title\n\n```sh\n# a comment\n```\n')).toEqual(['Title'])
    expect(h1s('# One\n\n# Two\n')).toHaveLength(2)
  })
})
