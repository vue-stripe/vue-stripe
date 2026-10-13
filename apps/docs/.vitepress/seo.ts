import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DefaultTheme, HeadConfig, TransformContext } from 'vitepress'

// Per-page SEO head: canonical URL, Open Graph and Twitter tags, robots and JSON-LD.
// Everything here is computed at build time from the page's own frontmatter and git date,
// so each static HTML file describes itself to search engines and AI crawlers.

export const SITE_URL = 'https://vuestripe.com'
export const SITE_NAME = 'Vue Stripe'
export const REPOSITORY_URL = 'https://github.com/vue-stripe/vue-stripe'
export const NPM_URL = 'https://www.npmjs.com/package/@vue-stripe/vue-stripe'

export const maintainer = {
  name: 'Joff Tiquez',
  url: 'https://jofftiquez.dev',
  x: '@jrtiquez',
  sameAs: ['https://jofftiquez.dev', 'https://github.com/jofftiquez', 'https://x.com/jrtiquez']
}

/** A Diataxis section of the docs, as drawn by the nav (`match` is its activeMatch regex). */
export interface DocSection {
  name: string
  link: string
  match: string
}

/** What the home page's structured data says about the package itself. */
export interface PackageFacts {
  name: string
  version: string
  license: string
  peerDependencies: Record<string, string>
}

/** `guide/index.md` -> `/guide/`, `guide/testing.md` -> `/guide/testing`, `index.md` -> `/`. */
export function routeOf(relativePath: string): string {
  return '/' + relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')
}

export function sectionOf(route: string, sections: DocSection[]): DocSection | undefined {
  return sections.find((s) => new RegExp(s.match).test(route))
}

/** A sidebar entry that has a page of its own. */
interface SidebarLink {
  text: string
  link: string
}

/**
 * The sidebar entries with a page of their own on the way to `route`, outermost first and
 * ending with the page's own entry: the confirm pages sit under "Method confirmers"
 * (/api/composables/confirm/). Groups without a link ("Composables") have no page, so they
 * are not part of the trail. Empty when no sidebar links the page.
 */
export function sidebarTrail(route: string, sidebars: DefaultTheme.SidebarItem[][]): SidebarLink[] {
  const walk = (items: DefaultTheme.SidebarItem[], chain: SidebarLink[]): SidebarLink[] | null => {
    for (const item of items) {
      if (item.link === route) return [...chain, { text: item.text ?? '', link: route }]
      if (!item.items) continue
      const parent = item.link && item.text ? [{ text: item.text, link: item.link }] : []
      const found = walk(item.items, [...chain, ...parent])
      if (found) return found
    }
    return null
  }
  for (const sidebar of sidebars) {
    const found = walk(sidebar, [])
    if (found) return found
  }
  return []
}

/**
 * The date each file under `dir` was first committed, as an ISO string keyed by its path
 * relative to `dir`: the oldest commit that added the path, carried across renames. One
 * `git log` covers every page. Files not committed yet (and builds without git) have none.
 */
export function firstCommitDates(dir: string): Map<string, string> {
  const dates = new Map<string, string>()
  let log: string
  try {
    log = execFileSync(
      'git',
      [
        'log',
        '--reverse',
        '--relative',
        '--format=@@%aI',
        '--name-status',
        '-M',
        '--diff-filter=AR',
        '--',
        '.'
      ],
      {
        cwd: dir,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore']
      }
    )
  } catch {
    return dates
  }
  let date = ''
  for (const line of log.split('\n')) {
    if (line.startsWith('@@')) {
      date = new Date(line.slice(2)).toISOString()
      continue
    }
    const [status = '', from = '', to = ''] = line.split('\t')
    if (status === 'A' && !dates.has(from)) dates.set(from, date)
    else if (status.startsWith('R') && to && !dates.has(to)) dates.set(to, dates.get(from) ?? date)
  }
  return dates
}

let publishedDates: { dir: string; dates: Map<string, string> } | undefined
function datePublishedOf(srcDir: string, relativePath: string): string {
  if (publishedDates?.dir !== srcDir) {
    publishedDates = { dir: srcDir, dates: firstCommitDates(srcDir) }
  }
  return publishedDates.dates.get(relativePath) ?? ''
}

/** The image @nolebase/vitepress-plugin-og-image writes for a sidebar page. */
function ogImageOf(relativePath: string): string {
  const slash = relativePath.lastIndexOf('/')
  const dir = relativePath.slice(0, slash + 1)
  const name = relativePath.slice(slash + 1).replace(/\.md$/, '')
  return `${SITE_URL}/${dir}og-${name}.png`
}

const person = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#maintainer`,
  name: maintainer.name,
  url: maintainer.url,
  sameAs: maintainer.sameAs
}

const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  inLanguage: 'en-US'
}

// JSON-LD lives inside <script>; escaping "<" keeps a "</script>" in any string from closing it.
const jsonLd = (data: object): HeadConfig => [
  'script',
  { type: 'application/ld+json' },
  JSON.stringify(data).replace(/</g, '\\u003c')
]

function homeJsonLd(description: string, pkg: PackageFacts) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { ...website, description, publisher: { '@id': person['@id'] } },
      person,
      {
        '@type': ['SoftwareSourceCode', 'SoftwareApplication'],
        '@id': `${SITE_URL}/#software`,
        name: SITE_NAME,
        alternateName: pkg.name,
        description,
        url: `${SITE_URL}/`,
        codeRepository: REPOSITORY_URL,
        downloadUrl: NPM_URL,
        programmingLanguage: ['TypeScript', 'JavaScript', 'Vue'],
        runtimePlatform: ['Vue 3', 'Vue 2.7', 'Web browser'],
        softwareRequirements: Object.entries(pkg.peerDependencies).map(
          ([dep, range]) => `${dep} ${range}`
        ),
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        softwareVersion: pkg.version,
        license: `https://spdx.org/licenses/${pkg.license}.html`,
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        dateCreated: '2017-09-27',
        author: { '@id': person['@id'] },
        maintainer: { '@id': person['@id'] },
        isPartOf: { '@id': website['@id'] }
      }
    ]
  }
}

/**
 * The breadcrumb trail of a page, as the sidebar draws it: the site, the page's Diataxis
 * section, each sidebar group with a page of its own, then the page under its sidebar label
 * (its title when no sidebar links it). A section overview (/guide/, /api/, /live-demo/) is
 * the section itself and ends the trail; a page that is also its section's nav target (the
 * tutorial, the Explanation hub) still gets its own item, so the trail names the page.
 */
export function breadcrumbs(opts: {
  route: string
  title: string
  section: DocSection | undefined
  trail: SidebarLink[]
}): { name: string; url: string }[] {
  const { route, title, section, trail } = opts
  const crumbs = [{ name: SITE_NAME, url: `${SITE_URL}/` }]
  if (section) crumbs.push({ name: section.name, url: SITE_URL + section.link })
  for (const parent of trail.slice(0, -1)) {
    if (parent.link !== section?.link)
      crumbs.push({ name: parent.text, url: SITE_URL + parent.link })
  }
  if (section?.link !== route || !route.endsWith('/')) {
    crumbs.push({ name: trail[trail.length - 1]?.text || title, url: SITE_URL + route })
  }
  return crumbs
}

function articleJsonLd(opts: {
  url: string
  headline: string
  description: string
  image: string
  datePublished: string
  dateModified: string
  section: DocSection | undefined
  crumbs: { name: string; url: string }[]
}) {
  const { url, headline, description, image, datePublished, dateModified, section, crumbs } = opts

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        headline,
        description,
        url,
        mainEntityOfPage: url,
        image,
        inLanguage: 'en-US',
        ...(datePublished && { datePublished }),
        ...(dateModified && { dateModified }),
        ...(section && { articleSection: section.name }),
        author: person,
        publisher: { '@id': person['@id'] },
        about: { '@id': `${SITE_URL}/#software`, name: SITE_NAME },
        isPartOf: website
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: c.url
        }))
      }
    ]
  }
}

/** The home page's static share card (public/og-image.png) and what it shows. */
const HOME_IMAGE = `${SITE_URL}/og-image.png`
const HOME_IMAGE_ALT = 'Vue Stripe: Stripe Checkout and Elements for Vue.js'

/** Alt text for a page's generated share card, which shows its section and sidebar label. */
export function ogImageAlt(card: { title: string; category?: string | undefined }): string {
  return card.category
    ? `${SITE_NAME} ${card.category}: ${card.title}`
    : `${SITE_NAME}: ${card.title}`
}

export function seoHead(
  { pageData, siteData, siteConfig, title }: TransformContext,
  opts: { sections: DocSection[]; pkg: PackageFacts; sidebars: DefaultTheme.SidebarItem[][] }
): HeadConfig[] {
  const { relativePath } = pageData
  const isHome = relativePath === 'index.md' || relativePath === ''
  const isNotFound = pageData.isNotFound || relativePath === '404.md'
  const route = routeOf(relativePath)
  const url = SITE_URL + route
  // A page that repeats another (`canonical: /path` frontmatter) names that page as canonical.
  const canonical =
    typeof pageData.frontmatter['canonical'] === 'string'
      ? SITE_URL + pageData.frontmatter['canonical']
      : url
  const description = pageData.description || siteData.description
  // Sidebar pages get a generated image from the OG image plugin (in buildEnd); the home
  // page uses the static one.
  const image = isHome ? HOME_IMAGE : ogImageOf(relativePath)
  const dateModified = pageData.lastUpdated ? new Date(pageData.lastUpdated).toISOString() : ''
  const datePublished = isHome ? '' : datePublishedOf(siteConfig.srcDir, relativePath)

  if (isNotFound) return [['meta', { name: 'robots', content: 'noindex, follow' }]]

  const head: HeadConfig[] = [
    ['link', { rel: 'canonical', href: canonical }],
    ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large' }],
    ['meta', { property: 'og:type', content: isHome ? 'website' : 'article' }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: canonical }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }]
  ]

  // The plugin writes the other pages' image tags; finishOgTags adds their alt text.
  if (isHome) {
    head.push(
      ['meta', { property: 'og:image', content: image }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:type', content: 'image/png' }],
      ['meta', { property: 'og:image:alt', content: HOME_IMAGE_ALT }],
      ['meta', { name: 'twitter:image', content: image }],
      ['meta', { name: 'twitter:image:alt', content: HOME_IMAGE_ALT }]
    )
  }
  if (datePublished) {
    head.push(['meta', { property: 'article:published_time', content: datePublished }])
  }
  if (dateModified && !isHome) {
    head.push(['meta', { property: 'article:modified_time', content: dateModified }])
  }

  const section = sectionOf(route, opts.sections)
  head.push(
    jsonLd(
      isHome
        ? homeJsonLd(description, opts.pkg)
        : articleJsonLd({
            url,
            headline: pageData.title,
            description,
            image,
            datePublished,
            dateModified,
            section,
            crumbs: breadcrumbs({
              route,
              title: pageData.title,
              section,
              trail: sidebarTrail(route, opts.sidebars)
            })
          })
    )
  )
  return head
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Finishes the Open Graph tags of the pages that got a generated image. The OG image plugin
 * rewrites them with rehype-meta, which resets og:type to "website" (every page but the home
 * page is an article) and writes og:image without its type or alt text. The alt text goes
 * right after each image tag, where parsers attach structured properties.
 */
export function finishOgTags(outDir: string, altOf: (route: string) => string | undefined): void {
  const website = '<meta property="og:type" content="website">'
  for (const file of readdirSync(outDir, { recursive: true, encoding: 'utf8' })) {
    if (!file.endsWith('.html') || file === 'index.html' || file === '404.html') continue
    const path = join(outDir, file)
    let html = readFileSync(path, 'utf8')
    html = html.replace(website, '<meta property="og:type" content="article">')
    const alt = altOf(routeOf(file.replace(/\\/g, '/').replace(/\.html$/, '.md')))
    if (alt && !html.includes('property="og:image:alt"')) {
      const content = escapeAttribute(alt)
      html = html
        .replace(
          /(<meta property="og:image:height" content="\d+">)/,
          `$1\n<meta property="og:image:type" content="image/png">\n<meta property="og:image:alt" content="${content}">`
        )
        .replace(
          /(<meta name="twitter:image" content="[^"]*">)/,
          `$1\n<meta name="twitter:image:alt" content="${content}">`
        )
    }
    writeFileSync(path, html)
  }
}
