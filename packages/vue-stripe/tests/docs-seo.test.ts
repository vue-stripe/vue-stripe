import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SITE_URL,
  breadcrumbs,
  firstCommitDates,
  ogImageAlt,
  sectionOf,
  sidebarTrail,
  type DocSection
} from '../../../apps/docs/.vitepress/seo'
import { homeMarkdown, parseFrontmatter } from '../../../apps/docs/.vitepress/llms'

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
// The <title> ("<page title> | Vue Stripe") range search results show in full while still
// naming the topic.
const TITLE_MIN = 30
const TITLE_MAX = 65

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
    canonical: data.canonical,
    headings,
    source
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

  it('every page title is 30 to 65 characters with the site name', () => {
    const problems = pages
      .filter((p) => !p.customLayout)
      .map((p) => ({ path: p.path, full: `${p.title} | Vue Stripe` }))
      .filter(({ full }) => full.length < TITLE_MIN || full.length > TITLE_MAX)
      .map(({ path, full }) => `${path}: "${full}" is ${full.length} characters`)
    expect(problems, problems.join('\n')).toEqual([])
  })

  it('a canonical frontmatter points at another existing page', () => {
    const problems = pages
      .filter((p) => p.canonical !== undefined)
      .filter((p) => {
        const target = p.canonical!.replace(/^\//, '')
        const file = join(docsDir, target.endsWith('/') ? `${target}index.md` : `${target}.md`)
        return !existsSync(file) || relative(docsDir, file) === p.path
      })
      .map((p) => `${p.path}: canonical ${p.canonical} is not another page`)
    expect(problems, problems.join('\n')).toEqual([])
  })

  it('every live demo widget sits under an h2, so its h3 step headings nest', () => {
    const problems = pages
      .filter((p) => p.path.startsWith('live-demo/') && !p.path.endsWith('index.md'))
      .filter((p) => {
        const before = p.source.split(/^<\w+Example\b/m)[0] ?? ''
        return !/^## /m.test(before) || !/^<\w+Example\b/m.test(p.source)
      })
      .map((p) => `${p.path}: no h2 before the demo component`)
    expect(problems, problems.join('\n')).toEqual([])
  })

  it('demo widgets use h3 and h4 headings only', () => {
    const examplesDir = join(docsDir, '.vitepress/theme/components/examples')
    const problems = readdirSync(examplesDir)
      .filter((name) => name.endsWith('.vue'))
      .flatMap((name) =>
        [...readFileSync(join(examplesDir, name), 'utf8').matchAll(/<h([1256])\b/g)].map(
          (m) => `${name}: <h${m[1]}>`
        )
      )
    expect(problems, problems.join('\n')).toEqual([])
  })

  it('ignores # lines inside code blocks when counting H1s', () => {
    expect(h1s('---\ntitle: x\n---\n\n# Title\n\n```sh\n# a comment\n```\n')).toEqual(['Title'])
    expect(h1s('# One\n\n# Two\n')).toHaveLength(2)
  })
})

describe('docs SEO head and share cards', () => {
  const sections: DocSection[] = [
    { name: 'Tutorials', link: '/guide/first-payment', match: '^/guide/first-payment' },
    { name: 'How-to guides', link: '/guide/', match: '^/guide/(?!first-payment)' },
    { name: 'Reference', link: '/api/', match: '^/(api|coverage)(/|$)' }
  ]
  const sidebars = [
    [
      { text: 'Documentation overview', link: '/guide/' },
      { text: 'Take your first test payment', link: '/guide/first-payment' }
    ],
    [
      { text: 'Overview', link: '/api/' },
      {
        text: 'Composables',
        items: [
          {
            text: 'Method confirmers',
            link: '/api/composables/confirm/',
            items: [{ text: 'Cards', link: '/api/composables/confirm/cards' }]
          }
        ]
      }
    ]
  ]
  const trailOf = (route: string, title = 'Page title') =>
    breadcrumbs({
      route,
      title,
      section: sectionOf(route, sections),
      trail: sidebarTrail(route, sidebars)
    }).map((c) => `${c.name} ${c.url.replace(SITE_URL, '')}`)

  it('breadcrumbs include each sidebar group that has a page', () => {
    expect(trailOf('/api/composables/confirm/cards')).toEqual([
      'Vue Stripe /',
      'Reference /api/',
      'Method confirmers /api/composables/confirm/',
      'Cards /api/composables/confirm/cards'
    ])
  })

  it("breadcrumbs name a page that is its section's nav target", () => {
    expect(trailOf('/guide/first-payment')).toEqual([
      'Vue Stripe /',
      'Tutorials /guide/first-payment',
      'Take your first test payment /guide/first-payment'
    ])
  })

  it('breadcrumbs end at a section overview', () => {
    expect(trailOf('/guide/')).toEqual(['Vue Stripe /', 'How-to guides /guide/'])
  })

  it('a page no sidebar links is named by its title', () => {
    expect(trailOf('/guide/orphan', 'Orphan page').at(-1)).toBe('Orphan page /guide/orphan')
  })

  it('reads the first commit date of every committed page from git', () => {
    const dates = firstCommitDates(docsDir)
    // Skipped without git history (a source tarball); CI checks out the full history.
    if (dates.size === 0) return
    const date = dates.get('guide/installation.md')
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/)
    expect(Date.parse(date!)).toBeLessThan(Date.now())
  }, 20_000) // one git log over the whole docs history; room for a loaded CI runner

  it('describes the share card it alt-texts', () => {
    expect(ogImageAlt({ title: 'useStripe', category: 'Reference' })).toBe(
      'Vue Stripe Reference: useStripe'
    )
    expect(ogImageAlt({ title: 'Somewhere' })).toBe('Vue Stripe: Somewhere')
  })

  it('the share card template fits its text on the card', () => {
    const template = readFileSync(join(docsDir, 'public/og-template.svg'), 'utf8')
    // The site description is wider than the card; the template must not print it.
    expect(template).not.toContain('{{siteDescription}}')
    expect(template).toContain('{{category}}')
  })

  it('writes the home page as Markdown with its sections and example code', () => {
    const { body } = parseFrontmatter(readFileSync(join(docsDir, 'index.md'), 'utf8'))
    const markdown = homeMarkdown(body)
    expect(markdown).toMatch(/^# Vue Stripe: /)
    expect(markdown).toContain('## Pick how you take payments')
    expect(markdown).toContain('### src/CheckoutPage.vue\n\n```vue\n')
    expect(markdown).toContain('### server.mjs\n\n```js\n')
    // A Vue file's own closing </template> stays inside its fence
    expect(markdown).toContain('</template>\n```')
    // No Vue component or layout tags outside the code fences.
    const prose = markdown.replace(/^```[\s\S]*?^```/gm, '')
    expect(prose).not.toMatch(/<\/?(template|HomeHero|HomeSection|main)\b/)
  })
})
