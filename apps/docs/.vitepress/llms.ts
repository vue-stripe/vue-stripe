import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { DefaultTheme, SiteConfig } from 'vitepress'
import type { CoverageCategory } from './theme/data/stripe-coverage'
import {
  FEATURES,
  HERO,
  HERO_FILES,
  INTEGRATIONS,
  INTEGRATIONS_COMPARE,
  INTEGRATIONS_LEDE,
  INTEGRATIONS_TITLE
} from './theme/data/home'
import {
  GITHUB_PAGE,
  JSDELIVR_PAGE,
  LEGACY_PACKAGE,
  NPM_PAGE,
  PACKAGE,
  formatCount,
  formatDay,
  hasAnyFigure,
  usageFigures,
  type UsageData
} from './theme/data/usage'
import {
  addedRange,
  extremes,
  formatMeasuredAt,
  formatSize,
  groupExports,
  hasSizes,
  homeSizeFigures,
  type BundleSizes,
  type Size
} from './theme/data/bundle-size'
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
  /**
   * Markdown that stands in for a component the page renders, e.g. the coverage table, keyed
   * by component name, or by `Name#part` for a tag with a `part` attribute.
   */
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

/**
 * Turns a docs page body into plain Markdown, leaving code blocks untouched. With the page's
 * `route`, a same-page link (`[Events](#events)`) names its page too, so it still points there
 * from /llms-full.txt, where every page shares one file.
 */
export function toPlainMarkdown(
  body: string,
  components: Record<string, string> = {},
  route?: string
): string {
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
    const [, component, attributes = ''] = /^\s*<\/?([A-Z][\w-]*)\b([^>]*)>\s*$/.exec(line) ?? []
    if (component) {
      const part = /\bpart="([\w-]+)"/.exec(attributes)?.[1]
      const replacement = (part && components[`${component}#${part}`]) || components[component]
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
        .replace(/\]\((#[^)]*)\)/g, (link, fragment: string) =>
          route ? `](${absolute(route)}${fragment})` : link
        )
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
        const label =
          item.status === 'covered'
            ? 'Covered.'
            : item.status === 'accessible'
              ? 'Reachable through useStripe() or useStripeElements().'
              : item.status === 'planned'
                ? 'Planned.'
                : 'Not wrapped.'
        // The page shows a row's note whatever its status (a beta flag, a deprecation).
        const note = item.note ?? (item.status === 'deprecated' ? 'Deprecated by Stripe.' : '')
        const status = note ? `${label} ${note}` : label
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

/** The home page's usage strip as one line: the same four figures, linking to /usage. */
export function homeUsageMarkdown(data: UsageData): string {
  const { npm, github } = data
  const parts = [
    npm.allTime !== null && `${formatCount(npm.allTime)} npm downloads of \`${PACKAGE}\``,
    npm.lastWeek !== null && `${formatCount(npm.lastWeek)} downloads a week`,
    github.stars !== null && `${formatCount(github.stars)} GitHub stars`,
    github.contributors !== null && `${formatCount(github.contributors)} contributors`
  ].filter((p): p is string => Boolean(p))
  if (parts.length < 3) return ''
  return `${parts.join(', ')}${data.fetchedAt ? ` (as of ${formatDay(data.fetchedAt)})` : ''}. [See all the numbers](${absolute('/usage')}).`
}

/** The /usage numbers as Markdown, as of the build (the page itself refreshes them). */
export function usageMarkdown(data: UsageData): string {
  if (!hasAnyFigure(data)) {
    return `**Live numbers unavailable.** They could not be fetched when this file was built. See [${PACKAGE} on npm](${NPM_PAGE}), [vue-stripe/vue-stripe on GitHub](${GITHUB_PAGE}) and [${PACKAGE} on jsDelivr](${JSDELIVR_PAGE}).`
  }
  const value = (n: number | null) => (n === null ? 'Not available' : formatCount(n))
  const { npm, legacy } = data
  const rows = [
    [`npm downloads, all time (\`${PACKAGE}\`)`, value(npm.allTime)],
    [
      `npm downloads, all time, including the legacy \`${LEGACY_PACKAGE}\` package`,
      npm.allTime !== null && legacy.allTime !== null
        ? formatCount(npm.allTime + legacy.allTime)
        : 'Not available'
    ],
    // The second line a figure card shows (the CDN hits of the past month) goes beside its value.
    ...usageFigures(data).map((f) => [
      f.label,
      f.value !== null && f.detail ? `${value(f.value)} (${f.detail})` : value(f.value)
    ])
  ]
  const latest = npm.weekly[npm.weekly.length - 1]
  return [
    `Numbers as of ${data.fetchedAt ? formatDay(data.fetchedAt) : 'the last build'}${
      npm.through ? `; npm counts run through ${formatDay(npm.through)}` : ''
    }.`,
    '',
    '| Figure | Value |',
    '| --- | --- |',
    ...rows.map(([label, n]) => `| ${label} | ${n} |`),
    ...(latest
      ? [
          '',
          `Latest full week (${formatDay(latest.start)} to ${formatDay(latest.end)}): ${formatCount(latest.downloads)} npm downloads.`
        ]
      : []),
    // The page's chart and its "Every week as a table", under the same heading.
    ...(npm.weekly.length > 1
      ? [
          '',
          '## Weekly npm downloads',
          '',
          `Downloads of \`${PACKAGE}\` in each of the past ${npm.weekly.length} weeks.`,
          '',
          '| Week | Downloads |',
          '| --- | --- |',
          ...npm.weekly.map(
            (w) => `| ${formatDay(w.start)} to ${formatDay(w.end)} | ${formatCount(w.downloads)} |`
          )
        ]
      : [])
  ].join('\n')
}

/** The bundle size the home page shows, as one line linking to /guide/bundle-size. */
export function homeBundleSizeMarkdown(data: BundleSizes): string {
  const figures = homeSizeFigures(data)
  if (!figures.length) return ''
  const list = figures.map((f) => `${f.value} for ${f.label.replace(/^useStripe/, '`useStripe`')}`)
  const last = list.pop()
  return `Bundle size, minified and gzipped: ${list.length ? `${list.join(', ')} and ${last}` : last}${
    data.version ? ` (\`${PACKAGE}\` ${data.version})` : ''
  }. [How bundle size works](${absolute('/guide/bundle-size')}).`
}

const sizeCells = (size: Size) => `${formatSize(size.minified, 2)} | ${formatSize(size.gzip, 2)}`
const code = (name: string) => `\`${name}\``

/**
 * The parts of /guide/bundle-size its component renders (`<BundleSize part="..." />`), as
 * Markdown keyed `BundleSize#<part>`. Without measured sizes only the summary says why.
 */
export function bundleSizeMarkdown(data: BundleSizes): Record<string, string> {
  if (!hasSizes(data)) {
    return {
      'BundleSize#summary': `**Sizes are measured when the site is built.** This copy was built without the library's \`dist\`, so it has no numbers. [The page on the site](${absolute('/guide/bundle-size')}) has them.`
    }
  }
  const payment = data.combinations.find((c) => c.id === 'payment-element')
  const useStripe = data.exports.find((e) => e.name === 'useStripe')
  const ends = extremes(data.exports)
  const range = addedRange(data.exports)
  const measured = `Measured for \`${PACKAGE}\` ${data.version ?? ''} on ${
    data.measuredAt ? formatMeasuredAt(data.measuredAt) : 'the last build'
  } with ${data.bundler ?? 'Rolldown'}: each import bundled from the ES module build, tree-shaken and minified, with Vue and \`@stripe/stripe-js\` left out, then gzipped.`

  const summary = [
    '| What you import | Minified and gzipped |',
    '| --- | --- |',
    `| The whole library, every export | ${formatSize(data.total.gzip, 2)} |`,
    ...(payment
      ? [
          `| A Payment Element checkout (${payment.imports.map(code).join(', ')}) | ${formatSize(payment.size.gzip, 2)} |`
        ]
      : []),
    ...(useStripe ? [`| \`useStripe\` alone | ${formatSize(useStripe.gzip, 2)} |`] : []),
    ...(ends
      ? [
          `| The smallest export, \`${ends.smallest.name}\` | ${formatSize(ends.smallest.gzip, 2)} |`,
          `| The largest export, \`${ends.largest.name}\` | ${formatSize(ends.largest.gzip, 2)} |`
        ]
      : []),
    '',
    measured
  ].join('\n')

  const combinations = [
    '| Integration | Imports | Minified | Minified and gzipped |',
    '| --- | --- | --- | --- |',
    ...data.combinations.map(
      (c) => `| ${c.title} | ${c.imports.map(code).join(', ')} | ${sizeCells(c.size)} |`
    )
  ].join('\n')

  const elements =
    data.elements && range
      ? `\`${data.elements.base}\` on its own is ${formatSize(data.elements.first, 2)}, of which ${formatSize(data.elements.first - data.elements.own, 2)} is the element factory and provider plumbing that every element shares and ${formatSize(data.elements.own)} its own definition. Each element after the first adds ${formatSize(range.min)} to ${formatSize(range.max)}, ${formatSize(range.median)} for the median element; the table under [Every export](${absolute('/guide/bundle-size#every-export')}) lists each one.`
      : ''

  const { stylesheet, stripeLoader, builds } = data
  const other = [
    '| File | Size | Gzipped |',
    '| --- | --- | --- |',
    ...(stylesheet
      ? [
          `| Stylesheet, \`${PACKAGE}/style.css\` | ${formatSize(stylesheet.raw, 2)} | ${formatSize(stylesheet.gzip, 2)} |`
        ]
      : []),
    ...(stripeLoader
      ? [
          `| \`@stripe/stripe-js\` ${stripeLoader.version} loader (\`pure\` entry), minified | ${sizeCells(stripeLoader.size)} |`
        ]
      : []),
    ...(builds.cjs
      ? [`| CommonJS build, \`dist/cjs/index.cjs\` | ${sizeCells(builds.cjs)} |`]
      : []),
    ...(builds.umd ? [`| UMD build, \`dist/umd/index.js\` | ${sizeCells(builds.umd)} |`] : [])
  ].join('\n')

  const budgets = data.budgets.length
    ? [
        '| Check | Limit | Measured |',
        '| --- | --- | --- |',
        ...data.budgets.map(
          (b) => `| ${b.name} | ${formatSize(b.limit, 2)} | ${formatSize(b.size, 2)} |`
        )
      ].join('\n')
    : ''

  const table = groupExports(data.exports)
    .map((group) =>
      [
        `### ${group.title}`,
        '',
        '| Export | Minified | Minified and gzipped | Note |',
        '| --- | --- | --- | --- |',
        ...group.exports.map((e) => {
          const name = e.link ? `[\`${e.name}\`](${absolute(e.link)})` : code(e.name)
          const note = e.aliasOf
            ? `Another name for \`${e.aliasOf}\``
            : e.added !== undefined
              ? `Adds ${formatSize(e.added)} after another element`
              : ''
          return `| ${name} | ${sizeCells(e)} | ${note} |`
        })
      ].join('\n')
    )
    .join('\n\n')

  return {
    'BundleSize#summary': summary,
    'BundleSize#combinations': combinations,
    'BundleSize#elements': elements,
    'BundleSize#other': other,
    'BundleSize#budgets': budgets,
    'BundleSize#table': table
  }
}

/**
 * The home page as Markdown. Its copy lives in the home components (./theme/data/home.ts);
 * index.md adds the hero's example project, one code fence per `<template #file>` slot, and
 * the live demo section.
 */
export function homeMarkdown(body: string, components: Record<string, string> = {}): string {
  const link = (text: string, href: string) => `[${text}](${absolute(href)})`
  const code = new Map(
    // The fence, not the slot: a Vue file's own </template> line sits inside the fence.
    [...body.matchAll(/^<template #(\w+)>\s*\n(```[^\n]*\n[\s\S]*?\n```)\s*\n<\/template>/gm)].map(
      ([, id, fence]) => [id, fence!.trim().replace(/^(```\w+):line-numbers/, '$1')]
    )
  )
  const demo = /<HomeSection\b[^>]*\btitle="([^"]*)"[^>]*\blede="([^"]*)"/.exec(body)
  return [
    `# ${HERO.name}: ${HERO.title}`,
    '',
    HERO.lede,
    '',
    ...HERO.actions.map((a) => `- ${link(a.text, a.link)}`),
    `- ${HERO.notice.text}: ${link(HERO.notice.linkText, HERO.notice.link)}`,
    '',
    ...(components['HomeUsage']
      ? ['## Vue Stripe in numbers', '', components['HomeUsage'], '']
      : []),
    '## Features',
    '',
    ...FEATURES.map((f) => `- **${f.link ? link(f.title, f.link) : f.title}**: ${f.text}`),
    '',
    `## ${INTEGRATIONS_TITLE}`,
    '',
    `${INTEGRATIONS_LEDE} ${link(INTEGRATIONS_COMPARE.text, INTEGRATIONS_COMPARE.link)}.`,
    '',
    ...INTEGRATIONS.map(
      (o) =>
        `- **${o.title}** (\`${o.component}\`): ${o.text} ${link('Guide', o.guide)}${o.demo ? `, ${link('live demo', o.demo)}` : ''}.`
    ),
    '',
    '## Example: a Payment Element checkout',
    '',
    ...HERO_FILES.flatMap((f) => [
      `### ${f.folder ? `${f.folder}/` : ''}${f.name}`,
      '',
      code.get(f.id) ?? '',
      ''
    ]),
    ...(demo
      ? [
          `## ${demo[1]}`,
          '',
          `${demo[2]} ${link('Open the live demo', '/live-demo/payment-element')}.`
        ]
      : [])
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
      const route = routeOf(relativePath)
      const markdown = toPlainMarkdown(body, options.components, route)
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

  // The home page leads both files, as the overview of everything else.
  const homeSource = parseFrontmatter(readFileSync(join(siteConfig.srcDir, 'index.md'), 'utf8'))
  const home: Page = {
    relativePath: 'index.md',
    route: '/',
    title: 'Vue Stripe home page',
    description: homeSource.data['description'] ?? '',
    section: undefined,
    markdown: homeMarkdown(homeSource.body, options.components)
  }

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
    '## Start here',
    '',
    `- [${home.title}](${markdownUrl(home.route)}): ${home.description}`,
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
    ...[home, ...grouped.flatMap(({ pages }) => pages)].map((p) => `---\n\n${pageDocument(p)}`)
  ].join('\n')

  const outDir = siteConfig.outDir
  writeFileSync(join(outDir, 'llms.txt'), llms)
  writeFileSync(join(outDir, 'llms-full.txt'), full)
  for (const page of [home, ...pages]) {
    const file = join(outDir, page.relativePath)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, pageDocument(page))
  }
}
