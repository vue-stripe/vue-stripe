import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { DefaultTheme, SiteConfig } from 'vitepress'
import type { CoverageCategory } from './theme/data/stripe-coverage'
import { SITE_URL, routeOf, sectionOf, type DocSection } from './seo'

// Build-time Markdown for language models (https://llmstxt.org): /llms.txt indexes every page
// with its description, /llms-full.txt holds the whole documentation in one file, and each
// page is also written next to its HTML as Markdown (/guide/testing -> /guide/testing.md).
// The Markdown is the page source with frontmatter, Vue components and VitePress-only syntax
// turned into plain Markdown, and site links made absolute.

interface Page {
  relativePath: string
  route: string
  title: string
  description: string
  section: DocSection | undefined
  markdown: string
}

export interface LlmsOptions {
  sections: DocSection[]
  /** Sidebars in display order; they give the pages their order. */
  sidebars: DefaultTheme.SidebarItem[][]
  /** The Markdown under the H1 of llms.txt and llms-full.txt (summary blockquote and facts). */
  header: string
  /** Markdown that stands in for a component the page renders, e.g. the coverage table. */
  components?: Record<string, string>
}

/** Reads the flat `key: value` frontmatter the docs use (values may be quoted). */
export function parseFrontmatter(source: string): { data: Record<string, string>; body: string } {
  const [block, yaml = ''] = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source) ?? []
  if (!block) return { data: {}, body: source }
  const data: Record<string, string> = {}
  for (const line of yaml.split(/\r?\n/)) {
    const [, key, raw = ''] = /^([\w-]+):\s*(.*)$/.exec(line) ?? []
    if (!key) continue
    let value = raw.trim()
    if (/^".*"$/.test(value)) value = value.slice(1, -1).replace(/\\"/g, '"')
    else if (/^'.*'$/.test(value)) value = value.slice(1, -1).replace(/''/g, "'")
    data[key] = value
  }
  return { data, body: source.slice(block.length) }
}

const absolute = (href: string) => (href.startsWith('/') ? SITE_URL + href : href)

/** Turns a docs page body into plain Markdown, leaving code blocks untouched. */
export function toPlainMarkdown(body: string, components: Record<string, string> = {}): string {
  // The live-demo index lays out its links as HTML cards.
  const text = body
    .replace(
      /^[ \t]*<a href="([^"]+)" class="example-card">[\s\S]*?<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/a>/gm,
      (_, href: string, name: string, about: string) =>
        `- [${name.trim()}](${href}): ${about.trim()}`
    )
    .replace(/^(- \[.*)\n\n(?=- \[)/gm, '$1\n')

  const out: string[] = []
  let fence = ''
  let skipping = ''
  for (const line of text.split('\n')) {
    const fenceMark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence) {
      if (fenceMark && fenceMark[0] === fence[0] && fenceMark.length >= fence.length) fence = ''
      out.push(line)
      continue
    }
    if (fenceMark) {
      fence = fenceMark
      out.push(line)
      continue
    }
    if (skipping) {
      if (new RegExp(`^</${skipping}>`).test(line.trim())) skipping = ''
      continue
    }
    const block = /^<(script|style)\b/.exec(line.trim())?.[1]
    if (block) {
      if (!new RegExp(`</${block}>`).test(line)) skipping = block
      continue
    }

    // A line that is only a Vue component tag: substitute or drop it.
    const component = /^\s*<\/?([A-Z][\w-]*)\b[^>]*>\s*$/.exec(line)?.[1]
    if (component) {
      const replacement = components[component]
      if (replacement) out.push(replacement)
      continue
    }
    // Layout-only HTML wrappers.
    if (/^\s*<\/?(div|span)\b[^>]*>\s*$/.test(line)) continue

    // VitePress containers: keep the title as a bold line, drop the fences.
    const container = /^:::\s*([\w-]+)?\s*(.*)$/.exec(line)
    if (container) {
      const [, type, title] = container
      if (type && type !== 'code-group') {
        out.push(`**${title || type.charAt(0).toUpperCase() + type.slice(1)}**`, '')
      }
      continue
    }

    out.push(
      line
        .replace(/<DocIcon\b[^>]*\/>\s?/g, '')
        .replace(/^(#{1,6} .*?)\s*\{#[^}]+\}\s*$/, '$1')
        .replace(
          /<img\b[^>]*>/g,
          (img) =>
            `![${/alt="([^"]*)"/.exec(img)?.[1] ?? ''}](${absolute(/src="([^"]*)"/.exec(img)?.[1] ?? '')})`
        )
        .replace(/\]\((\/[^)]*)\)/g, (_, href: string) => `](${absolute(href)})`)
    )
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** The coverage page's table, as Markdown (the page itself renders it with a component). */
export function coverageMarkdown(coverage: CoverageCategory[]): string {
  return coverage
    .map((category) => {
      const rows = category.items.map((item) => {
        const status =
          item.status === 'covered'
            ? 'Covered'
            : item.status === 'accessible'
              ? 'Reachable through useStripe() or useStripeElements()'
              : item.status === 'planned'
                ? 'Planned'
                : `Not wrapped. ${item.note ?? 'Deprecated by Stripe.'}`
        return `| ${item.name} | \`${item.api}\` | ${item.artifact ? `\`${item.artifact}\`` : '-'} | ${status} |`
      })
      return [
        `## ${category.group}`,
        '',
        '| Feature | Stripe.js | Vue Stripe | Status |',
        '| --- | --- | --- | --- |',
        ...rows
      ].join('\n')
    })
    .join('\n\n')
}

function flattenSidebar(items: DefaultTheme.SidebarItem[]): { text: string; link: string }[] {
  return items.flatMap((item) => [
    ...(item.link && item.text ? [{ text: item.text, link: item.link }] : []),
    ...(item.items ? flattenSidebar(item.items) : [])
  ])
}

/** Puts the description under the H1 and the page URL under that. */
function pageDocument(page: Page): string {
  const intro = `${page.description ? `> ${page.description}\n\n` : ''}Source: ${SITE_URL}${page.route}`
  const h1 = /^# .*$/m.exec(page.markdown)
  if (!h1) return `# ${page.title}\n\n${intro}\n\n${page.markdown}\n`
  const end = h1.index + h1[0].length
  return `${page.markdown.slice(0, end)}\n\n${intro}${page.markdown.slice(end)}\n`
}

const markdownUrl = (route: string) =>
  `${SITE_URL}${route.endsWith('/') ? `${route}index` : route}.md`

export function writeLlmsFiles(siteConfig: SiteConfig, options: LlmsOptions): void {
  const sidebarLinks = options.sidebars.flatMap(flattenSidebar)
  const order = new Map(sidebarLinks.map((l, i) => [l.link, i]))

  const pages: Page[] = siteConfig.pages
    .filter((p) => p !== 'index.md' && p !== '404.md')
    .map((relativePath) => {
      const { data, body } = parseFrontmatter(
        readFileSync(join(siteConfig.srcDir, relativePath), 'utf8')
      )
      const markdown = toPlainMarkdown(body, options.components)
      const route = routeOf(relativePath)
      const heading = /^# (.*)$/m.exec(markdown)?.[1]?.replace(/`/g, '')
      return {
        relativePath,
        route,
        title: data['title'] ?? heading ?? route,
        description: data['description'] ?? '',
        section: sectionOf(route, options.sections),
        markdown
      }
    })
    .sort(
      (a, b) =>
        (order.get(a.route) ?? Infinity) - (order.get(b.route) ?? Infinity) ||
        a.route.localeCompare(b.route)
    )

  const grouped = options.sections.map((section) => ({
    section,
    pages: pages.filter((p) => p.section === section)
  }))
  const unsorted = pages.filter((p) => !p.section)
  if (unsorted.length)
    grouped.push({ section: { name: 'Other', link: '/', match: '' }, pages: unsorted })

  const llms = [
    '# Vue Stripe',
    '',
    options.header.trim(),
    '',
    ...grouped.flatMap(({ section, pages }) => [
      `## ${section.name}`,
      '',
      ...pages.map(
        (p) => `- [${p.title}](${markdownUrl(p.route)})${p.description ? `: ${p.description}` : ''}`
      ),
      ''
    ])
  ].join('\n')

  const full = [
    '# Vue Stripe',
    '',
    options.header.trim(),
    '',
    ...grouped.flatMap(({ pages }) => pages.map((p) => `---\n\n${pageDocument(p)}`))
  ].join('\n')

  const outDir = siteConfig.outDir
  writeFileSync(join(outDir, 'llms.txt'), llms)
  writeFileSync(join(outDir, 'llms-full.txt'), full)
  for (const page of pages) {
    const file = join(outDir, page.relativePath)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, pageDocument(page))
  }
}
