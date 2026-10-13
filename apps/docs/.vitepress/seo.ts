import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { HeadConfig, TransformContext } from 'vitepress'

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

function articleJsonLd(opts: {
  url: string
  route: string
  headline: string
  description: string
  image: string
  dateModified: string
  section: DocSection | undefined
}) {
  const { url, route, headline, description, image, dateModified, section } = opts
  const crumbs = [{ name: SITE_NAME, url: `${SITE_URL}/` }]
  if (section) crumbs.push({ name: section.name, url: SITE_URL + section.link })
  if (!section || section.link !== route) crumbs.push({ name: headline, url })

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

export function seoHead(
  { pageData, siteData, title }: TransformContext,
  opts: { sections: DocSection[]; pkg: PackageFacts }
): HeadConfig[] {
  const { relativePath } = pageData
  const isHome = relativePath === 'index.md' || relativePath === ''
  const isNotFound = pageData.isNotFound || relativePath === '404.md'
  const route = routeOf(relativePath)
  const url = SITE_URL + route
  const description = pageData.description || siteData.description
  // Sidebar pages get a generated image from the OG image plugin (in buildEnd); the home
  // page uses the static one.
  const image = isHome ? `${SITE_URL}/og-image.png` : ogImageOf(relativePath)
  const dateModified = pageData.lastUpdated ? new Date(pageData.lastUpdated).toISOString() : ''

  if (isNotFound) return [['meta', { name: 'robots', content: 'noindex, follow' }]]

  const head: HeadConfig[] = [
    ['link', { rel: 'canonical', href: url }],
    ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large' }],
    ['meta', { property: 'og:type', content: isHome ? 'website' : 'article' }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }]
  ]

  if (isHome) {
    head.push(
      ['meta', { property: 'og:image', content: image }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { name: 'twitter:image', content: image }]
    )
  }
  if (dateModified && !isHome) {
    head.push(['meta', { property: 'article:modified_time', content: dateModified }])
  }

  head.push(
    jsonLd(
      isHome
        ? homeJsonLd(description, opts.pkg)
        : articleJsonLd({
            url,
            route,
            headline: pageData.title,
            description,
            image,
            dateModified,
            section: sectionOf(route, opts.sections)
          })
    )
  )
  return head
}

/**
 * The OG image plugin rewrites each page's Open Graph tags with rehype-meta, which resets
 * og:type to "website". Every page but the home page is an article, so set it back.
 */
export function restoreArticleOgType(outDir: string): void {
  const website = '<meta property="og:type" content="website">'
  for (const file of readdirSync(outDir, { recursive: true, encoding: 'utf8' })) {
    if (!file.endsWith('.html') || file === 'index.html' || file === '404.html') continue
    const path = join(outDir, file)
    const html = readFileSync(path, 'utf8')
    if (html.includes(website)) {
      writeFileSync(path, html.replace(website, '<meta property="og:type" content="article">'))
    }
  }
}
