import { defineConfigWithTheme, loadEnv, type DefaultTheme, type HeadConfig } from 'vitepress'
import { buildEndGenerateOpenGraphImages } from '@nolebase/vitepress-plugin-og-image/vitepress'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { coverage } from './theme/data/stripe-coverage'
import {
  NPM_URL,
  REPOSITORY_URL,
  SITE_URL,
  finishOgTags,
  maintainer,
  ogImageAlt,
  sectionOf,
  seoHead,
  type DocSection
} from './seo'
import {
  bundleSizeMarkdown,
  coverageMarkdown,
  homeBundleSizeMarkdown,
  homeUsageMarkdown,
  parseFrontmatter,
  usageMarkdown,
  writeLlmsFiles
} from './llms'
import { loadUsage } from './theme/data/usage'
import { loadBundleSizes } from './theme/data/measure-bundle'

// Build the "Stripe.js Coverage NN%" nav label from the single coverage data source,
// so the toolbar stays in sync with the /coverage page automatically.
const coverageItems = coverage.flatMap((c) => c.items)
const coveredCount = coverageItems.filter((i) => i.status === 'covered').length
const trackableCount = coverageItems.filter((i) => i.status !== 'deprecated').length
const coveragePercent = trackableCount ? Math.floor((coveredCount / trackableCount) * 100) : 0
const coverageNavLabel = `Stripe.js Coverage ${coveragePercent}%`

// The docs follow Diataxis (https://diataxis.fr/): tutorials, how-to guides, reference and
// explanation. Files keep their URLs, so the four sections are drawn by the nav and sidebars:
// /api/ and /coverage are reference, and /guide/ holds the other three, told apart by slug.
const tutorialSlugs = ['first-payment', 'tutorial-']
const explanationSlugs = [
  'introduction',
  'architecture',
  'approaches',
  'payment-objects',
  'confirming-payments',
  'stripe-js-loading',
  'bundle-size',
  'stripe-js-versions',
  'security'
]
const tutorialMatch = `^/guide/(${tutorialSlugs.join('|')})`
const explanationMatch = `^/guide/(${explanationSlugs.join('|')})$`
// Every other /guide/ page, the documentation overview at /guide/ included, is a how-to guide.
const howToMatch = `^/guide/(?!(${tutorialSlugs.join('|')}|(${explanationSlugs.join('|')})$))`

// The sections in nav order. The nav, the breadcrumbs in each page's JSON-LD and the groups
// of /llms.txt all come from this list.
const docSections: DocSection[] = [
  { name: 'Tutorials', link: '/guide/first-payment', match: tutorialMatch },
  { name: 'How-to guides', link: '/guide/', match: howToMatch },
  { name: 'Reference', link: '/api/', match: '^/(api|coverage)(/|$)' },
  { name: 'Explanation', link: '/guide/introduction', match: explanationMatch },
  { name: 'Live demos', link: '/live-demo/', match: '^/live-demo/' }
]

// Package facts for the home page's structured data and /llms.txt, read from the library.
const pkg = JSON.parse(
  readFileSync(new URL('../../../packages/vue-stripe/package.json', import.meta.url), 'utf8')
) as { name: string; version: string; license: string; peerDependencies: Record<string, string> }

// A sidebar link to a page that does not exist fails the build with the link in the message,
// instead of the OG image step's bare ENOENT (it reads every linked file).
const docsRoot = fileURLToPath(new URL('../', import.meta.url))
const pageFile = (link: string) =>
  `${docsRoot}${link.replace(/^\//, '')}${link === '' || link.endsWith('/') ? 'index' : ''}.md`
const pageExists = (link: string) => existsSync(pageFile(link))
// A page with `canonical:` frontmatter repeats another page, so the sitemap lists only that one.
// That covers the stubs left at removed pages' old URLs (`noindex: true`) too.
const canonicalElsewhere = (link: string) =>
  pageExists(link) && 'canonical' in parseFrontmatter(readFileSync(pageFile(link), 'utf8')).data
const requirePages = (items: DefaultTheme.SidebarItem[]): DefaultTheme.SidebarItem[] =>
  items.map((item) => {
    if (item.link && !pageExists(item.link)) {
      throw new Error(
        `[Vue Stripe docs] Sidebar entry "${item.text}" links a missing page: ${item.link}`
      )
    }
    return item.items ? { ...item, items: requirePages(item.items) } : item
  })

const guideSidebar: DefaultTheme.SidebarItem[] = requirePages([
  {
    text: 'Start here',
    items: [{ text: 'Documentation overview', link: '/guide/' }]
  },
  {
    text: 'Tutorials',
    items: [{ text: 'Take your first test payment', link: '/guide/first-payment' }]
  },
  {
    text: 'How-to guides',
    items: [
      {
        text: 'Set up',
        collapsed: false,
        items: [
          { text: 'Install and set up', link: '/guide/installation' },
          { text: 'Use Vue Stripe on Vue 2.7', link: '/guide/vue-2' },
          { text: 'Use Vue Stripe with Nuxt and SSR', link: '/guide/ssr' },
          { text: 'Use Vue Stripe in a Vite SSR app', link: '/guide/vite-ssr' },
          { text: 'Use Vue Stripe in VitePress', link: '/guide/vitepress' },
          { text: 'Use Vue Stripe with Quasar', link: '/guide/quasar' },
          { text: 'Use Vue Stripe with Laravel and Inertia', link: '/guide/laravel' },
          { text: 'Provide Stripe app-wide (plugin)', link: '/guide/plugin' },
          { text: 'Upgrade from v5 to v6', link: '/guide/migration-v6' }
        ]
      },
      {
        text: 'Accept payments with Elements',
        collapsed: false,
        items: [
          { text: 'Accept a payment (Payment Element)', link: '/guide/payment-element' },
          { text: 'Collect details before creating an Intent', link: '/guide/deferred-intent' },
          { text: 'Add Apple Pay, Google Pay and Link', link: '/guide/express-checkout' },
          { text: 'Add Link to checkout', link: '/guide/link-authentication' },
          { text: 'Collect a shipping or billing address', link: '/guide/address-element' },
          { text: 'Accept card payments (Card Element)', link: '/guide/card-element' },
          { text: 'Show buy-now-pay-later messaging', link: '/guide/payment-method-messaging' },
          { text: 'Confirm payments on your server', link: '/guide/tokens' },
          { text: 'Handle errors and declines', link: '/guide/error-handling' }
        ]
      },
      {
        text: 'Bank debits',
        collapsed: false,
        items: [
          { text: 'Accept SEPA Direct Debit', link: '/guide/iban-element' },
          { text: 'Accept BECS Direct Debit', link: '/guide/au-bank-account-element' },
          { text: 'Accept ACH Direct Debit', link: '/guide/ach-debit' }
        ]
      },
      {
        text: 'Use Stripe Checkout',
        collapsed: false,
        items: [
          { text: 'Redirect to Stripe Checkout', link: '/guide/checkout' },
          { text: 'Embed Stripe Checkout', link: '/guide/embedded-checkout' },
          { text: 'Build your own page on a Checkout Session', link: '/guide/custom-checkout' },
          { text: 'Add the Checkout Form (beta)', link: '/guide/checkout-form' }
        ]
      },
      {
        text: 'Save cards and bill repeatedly',
        collapsed: false,
        items: [
          { text: 'Save a payment method for later', link: '/guide/setup-intent' },
          { text: 'Start a subscription', link: '/guide/subscriptions' },
          { text: 'Embed a pricing table', link: '/guide/pricing-table' }
        ]
      },
      {
        text: 'Customize, test and run',
        collapsed: false,
        items: [
          { text: 'Style elements', link: '/guide/styling' },
          { text: 'Test your integration', link: '/guide/testing' },
          { text: 'Fulfil orders with webhooks', link: '/guide/webhooks' },
          { text: 'Troubleshoot common problems', link: '/guide/troubleshooting' }
        ]
      },
      {
        text: 'Beyond payments',
        collapsed: false,
        items: [
          { text: 'Display issued card details', link: '/guide/issuing' },
          { text: "Verify a customer's identity", link: '/guide/identity' }
        ]
      }
    ]
  },
  {
    text: 'Explanation',
    items: [
      { text: 'About Vue Stripe', link: '/guide/introduction' },
      { text: 'How Vue Stripe works', link: '/guide/architecture' },
      { text: 'Choosing an integration', link: '/guide/approaches' },
      { text: 'Payment objects: Intents, Sessions, tokens', link: '/guide/payment-objects' },
      { text: 'How confirming works', link: '/guide/confirming-payments' },
      { text: 'How Stripe.js is loaded', link: '/guide/stripe-js-loading' },
      { text: 'Bundle size and tree-shaking', link: '/guide/bundle-size' },
      { text: 'Stripe.js versions and what v6 changed', link: '/guide/stripe-js-versions' },
      { text: 'What runs where: keys and PCI', link: '/guide/security' }
    ]
  }
])

const referenceSidebar: DefaultTheme.SidebarItem[] = requirePages([
  {
    text: 'Reference',
    items: [
      { text: 'Reference overview', link: '/api/' },
      { text: 'Stripe.js coverage', link: '/coverage' },
      { text: 'Types and errors', link: '/api/types' }
    ]
  },
  {
    text: 'Provider components',
    items: [
      { text: 'VueStripeProvider', link: '/api/components/stripe-provider' },
      { text: 'VueStripeElements', link: '/api/components/stripe-elements' }
    ]
  },
  {
    text: 'Element components',
    items: [
      { text: 'VueStripePaymentElement', link: '/api/components/stripe-payment-element' },
      {
        text: 'VueStripeExpressCheckoutElement',
        link: '/api/components/stripe-express-checkout-element'
      },
      { text: 'VueStripeCardElement', link: '/api/components/stripe-card-element' },
      { text: 'Split Card Elements', link: '/api/components/stripe-split-card-elements' },
      { text: 'VueStripeAddressElement', link: '/api/components/stripe-address-element' },
      {
        text: 'VueStripeLinkAuthenticationElement',
        link: '/api/components/stripe-link-authentication-element'
      },
      {
        text: 'VueStripePaymentMethodMessagingElement',
        link: '/api/components/stripe-payment-method-messaging-element'
      },
      { text: 'VueStripeTaxIdElement', link: '/api/components/stripe-tax-id-element' },
      {
        text: 'VueStripeCurrencySelectorElement',
        link: '/api/components/stripe-currency-selector-element'
      },
      {
        text: 'VueStripeContactDetailsElement',
        link: '/api/components/stripe-contact-details-element'
      },
      { text: 'VueStripeTermsElement (beta)', link: '/api/components/stripe-terms-element' },
      {
        text: 'VueStripeLinkSignupElement (beta)',
        link: '/api/components/stripe-link-signup-element'
      }
    ]
  },
  {
    text: 'Regional elements',
    items: [
      { text: 'VueStripeIbanElement', link: '/api/components/stripe-iban-element' },
      {
        text: 'VueStripeAuBankAccountElement',
        link: '/api/components/stripe-au-bank-account-element'
      }
    ]
  },
  {
    text: 'Issuing',
    items: [{ text: 'Issuing Elements', link: '/api/components/stripe-issuing-elements' }]
  },
  {
    text: 'Checkout and subscriptions',
    items: [
      { text: 'VueStripeCheckout', link: '/api/components/stripe-checkout' },
      { text: 'VueStripeEmbeddedCheckout', link: '/api/components/stripe-embedded-checkout' },
      {
        text: 'VueStripeCheckoutElementsProvider',
        link: '/api/components/stripe-checkout-provider'
      },
      {
        text: 'VueStripeCheckoutFormProvider (beta)',
        link: '/api/components/stripe-checkout-form-provider'
      },
      { text: 'VueStripeCheckoutForm (beta)', link: '/api/components/stripe-checkout-form' },
      { text: 'VueStripePricingTable', link: '/api/components/stripe-pricing-table' }
    ]
  },
  {
    text: 'Disclosures',
    items: [
      {
        text: 'VueStripeFinancialAccountDisclosure',
        link: '/api/components/stripe-financial-account-disclosure'
      },
      { text: 'VueStripeIssuingDisclosure', link: '/api/components/stripe-issuing-disclosure' },
      { text: 'VueStripeTreasuryDisclosure', link: '/api/components/stripe-treasury-disclosure' }
    ]
  },
  {
    text: 'Composables',
    items: [
      { text: 'useStripe', link: '/api/composables/use-stripe' },
      { text: 'useStripeElements', link: '/api/composables/use-stripe-elements' },
      { text: 'usePaymentIntent', link: '/api/composables/use-payment-intent' },
      { text: 'useSetupIntent', link: '/api/composables/use-setup-intent' },
      { text: 'useStripeCheckout', link: '/api/composables/use-stripe-checkout' },
      { text: 'useCheckoutSession', link: '/api/composables/use-checkout-session' },
      { text: 'useCheckoutForm (beta)', link: '/api/composables/use-checkout-form' },
      { text: 'useCreatePaymentMethod', link: '/api/composables/use-create-payment-method' },
      { text: 'useHandleNextAction', link: '/api/composables/use-handle-next-action' },
      {
        text: 'useCreateConfirmationToken',
        link: '/api/composables/use-create-confirmation-token'
      },
      { text: 'useCreateToken', link: '/api/composables/use-create-token' },
      { text: 'useHandleCardAction', link: '/api/composables/use-handle-card-action' },
      {
        text: 'useVerifyMicrodepositsForPayment',
        link: '/api/composables/use-verify-microdeposits-for-payment'
      },
      {
        text: 'useVerifyMicrodepositsForSetup',
        link: '/api/composables/use-verify-microdeposits-for-setup'
      },
      { text: 'useRadarSession', link: '/api/composables/use-radar-session' },
      { text: 'useEphemeralKeyNonce', link: '/api/composables/use-ephemeral-key-nonce' },
      {
        text: 'Method confirmers',
        link: '/api/composables/confirm/',
        collapsed: true,
        items: [
          { text: 'Cards', link: '/api/composables/confirm/cards' },
          { text: 'Bank debits', link: '/api/composables/confirm/bank-debits' },
          { text: 'Redirects and bank transfers', link: '/api/composables/confirm/redirects' },
          { text: 'Wallets', link: '/api/composables/confirm/wallets' },
          { text: 'Buy now, pay later', link: '/api/composables/confirm/bnpl' },
          { text: 'Vouchers', link: '/api/composables/confirm/vouchers' }
        ]
      },
      { text: 'useFinancialConnections', link: '/api/composables/use-financial-connections' },
      { text: 'useIdentity', link: '/api/composables/use-identity' },
      { text: 'usePaymentRequest', link: '/api/composables/use-payment-request' }
    ]
  },
  {
    text: 'Plugin',
    items: [{ text: 'createVueStripe', link: '/api/plugin' }]
  }
])

const liveDemoSidebar: DefaultTheme.SidebarItem[] = requirePages([
  {
    text: 'Live Demo',
    items: [{ text: 'All live demos', link: '/live-demo/' }]
  },
  {
    text: 'One-Time Payments',
    items: [
      { text: 'Stripe Checkout', link: '/live-demo/checkout-redirect' },
      { text: 'Payment Element', link: '/live-demo/payment-element' },
      { text: 'Embedded Checkout', link: '/live-demo/embedded-checkout' },
      { text: 'Custom Checkout', link: '/live-demo/custom-checkout' },
      { text: 'Checkout Form (beta)', link: '/live-demo/checkout-form' },
      { text: 'Card Element', link: '/live-demo/card-element' },
      { text: 'Split Card Elements', link: '/live-demo/split-card-elements' },
      { text: 'Link Authentication', link: '/live-demo/link-authentication' },
      { text: 'Express Checkout', link: '/live-demo/express-checkout' },
      { text: 'Payment Request', link: '/live-demo/payment-request' },
      { text: 'Address Element', link: '/live-demo/address-element' }
    ]
  },
  {
    text: 'Saving Cards and Tokens',
    items: [
      { text: 'Save a Card (SetupIntent)', link: '/live-demo/setup-intent' },
      { text: 'Create Payment Method', link: '/live-demo/create-payment-method' },
      { text: 'Tokens', link: '/live-demo/tokens' }
    ]
  },
  {
    text: 'Buy Now, Pay Later',
    items: [{ text: 'Payment Method Messaging', link: '/live-demo/payment-method-messaging' }]
  },
  {
    text: 'Regional Payment Methods',
    items: [
      { text: 'SEPA Direct Debit', link: '/live-demo/iban-element' },
      { text: 'BECS Direct Debit (Australia)', link: '/live-demo/becs-payment' },
      { text: 'ACH Direct Debit (US)', link: '/live-demo/ach-debit' }
    ]
  },
  {
    text: 'Identity',
    items: [{ text: 'Identity Verification', link: '/live-demo/identity' }]
  },
  {
    text: 'Subscriptions',
    items: [
      { text: 'Subscribe with Stripe Checkout', link: '/live-demo/subscription-checkout' },
      { text: 'Subscribe with Elements', link: '/live-demo/subscription-embedded' }
    ]
  }
])

const sidebars = [guideSidebar, referenceSidebar, liveDemoSidebar]

// Each page's share card (made by the OG image plugin in buildEnd) shows its sidebar label
// under its Diataxis section.
const flattenLinks = (items: DefaultTheme.SidebarItem[]): DefaultTheme.SidebarItem[] =>
  items.flatMap((item) => [...(item.link ? [item] : []), ...flattenLinks(item.items ?? [])])
const sidebarLabels = new Map(
  sidebars.flatMap(flattenLinks).map((item) => [item.link!, item.text ?? ''])
)
const ogCategory = (route: string) => sectionOf(route, docSections)?.name

// The text under the H1 of /llms.txt and /llms-full.txt.
const llmsHeader = `> Vue Stripe (${pkg.name}) is a Vue library for the browser side of a Stripe integration. It wraps Stripe.js 10 (Endive) Elements, embedded Checkout and the Stripe.js methods in Vue components and composables. One build runs on Vue 3 and Vue 2.7.

Vue Stripe was created in 2017 by ${maintainer.name} (${maintainer.sameAs.join(', ')}), who still maintains it. It is MIT licensed and a Stripe Verified Partner.

- Package: \`${pkg.name}\` ${pkg.version} on npm (${NPM_URL})
- Install: \`npm install ${pkg.name} @stripe/stripe-js\`, then import \`${pkg.name}/style.css\` once
- Peer dependencies: ${Object.entries(pkg.peerDependencies)
  .map(([dep, range]) => `${dep} ${range}`)
  .join(', ')}
- Source code and issues: ${REPOSITORY_URL}
- Documentation: ${SITE_URL}/
- The whole documentation in one file: ${SITE_URL}/llms-full.txt
- Every page is also available as Markdown at its URL plus \`.md\` (section overviews end in \`/index.md\`), as linked below.

The docs follow Diataxis: tutorials teach by doing, how-to guides solve one task each, the reference documents every export, and explanation pages cover how and why the library works. The live demos run each flow against Stripe's test mode.`

// Load environment variables from .env files (for local dev)
const envFromFile = loadEnv('', process.cwd())

// Helper to get env var (prefers shell env vars over .env file, for GitHub Actions)
const getEnv = (key: string): string => {
  // Shell environment variables (set in GitHub Actions via `env:` in workflow)
  const shellEnv = process.env[key]
  if (shellEnv) return shellEnv
  // Fall back to .env file values (for local development)
  return envFromFile[key] || ''
}

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = getEnv('VITE_GA_MEASUREMENT_ID')

// Google Analytics with Enhanced Measurement. A build without a measurement ID (local and
// preview builds) loads nothing, instead of a gtag.js install that measures nothing.
const googleAnalytics: HeadConfig[] = GA_MEASUREMENT_ID
  ? [
      [
        'script',
        { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}` }
      ],
      [
        'script',
        {},
        `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// Enhanced GA4 Configuration
gtag('config', '${GA_MEASUREMENT_ID}', {
  // Enhanced measurement settings
  send_page_view: true,
  allow_google_signals: true,
  allow_ad_personalization_signals: false,

  // Custom parameters
  custom_map: {
    'dimension1': 'page_type',
    'dimension2': 'component_name',
    'dimension3': 'user_journey_stage',
    'dimension4': 'scroll_depth',
    'dimension5': 'engagement_time'
  },

  // Enhanced link attribution
  link_attribution: true,

  // Content grouping
  content_group: 'documentation',

  // Cookie settings
  cookie_flags: 'SameSite=None;Secure'
});

// Enable debug mode in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  gtag('config', '${GA_MEASUREMENT_ID}', {
    debug_mode: true
  });
}`
      ]
    ]
  : []

// Default theme config plus the live-demo Stripe settings exposed through `useData().theme`.
interface ThemeConfig extends DefaultTheme.Config {
  stripeConfig: {
    publishableKey: string
    apiUrl: string
  }
}

export default defineConfigWithTheme<ThemeConfig>({
  title: 'Vue Stripe',
  description:
    'Vue components and composables for Stripe.js 10 Elements, Checkout and payment methods, for Vue 3 and Vue 2.7.',
  lang: 'en-US',
  base: '/',

  head: [
    // Google Analytics, only when a measurement ID is set (the deploy sets one).
    ...googleAnalytics,

    // Favicon
    ['link', { rel: 'icon', href: '/favicon.ico' }],

    // Basic meta. The canonical URL, robots, Open Graph and Twitter title / description / URL
    // and the JSON-LD differ per page, so transformHead adds them (see ./seo.ts).
    ['meta', { name: 'theme-color', content: '#635bff' }],
    ['meta', { name: 'author', content: maintainer.name }],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'Vue Stripe, Stripe Vue, Vue.js Stripe, Stripe Elements, Stripe Checkout, Payment Element, Stripe.js, Vue 3, Vue 2.7, Nuxt, TypeScript, payments'
      }
    ],
    ['link', { rel: 'alternate', type: 'text/plain', title: 'llms.txt', href: '/llms.txt' }],

    // Open Graph and Twitter Card, site-wide parts
    ['meta', { property: 'og:site_name', content: 'Vue Stripe' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:creator', content: maintainer.x }]
  ],

  sitemap: {
    hostname: 'https://vuestripe.com',
    transformItems: (items) => items.filter((item) => !canonicalElsewhere(item.url))
  },

  lastUpdated: true,

  themeConfig: {
    logo: { src: '/vue-stripe-logo-variant-1-small.png', alt: 'Vue Stripe' },

    // Environment config for live demos (passed to components via useData())
    stripeConfig: {
      publishableKey: getEnv('VITE_STRIPE_PUBLISHABLE_KEY'),
      apiUrl: getEnv('VITE_API_URL') || 'https://backend.vuestripe.com'
    },

    nav: [
      ...docSections.map((s) => ({ text: s.name, link: s.link, activeMatch: s.match })),
      { text: coverageNavLabel, link: '/coverage' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/vue-stripe/vue-stripe' },
          { text: 'NPM', link: 'https://www.npmjs.com/package/@vue-stripe/vue-stripe' },
          { text: 'Usage and downloads', link: '/usage' }
        ]
      }
    ],

    // One sidebar per URL prefix. Tutorials, how-to guides and explanation all live under
    // /guide/ and share one sidebar: VitePress picks a sidebar by prefix match, so per-page
    // keys ('/guide/checkout' also matches '/guide/checkout-form') would be fragile.
    sidebar: {
      '/guide/': guideSidebar,
      '/api/': referenceSidebar,
      '/coverage': referenceSidebar,
      '/live-demo/': liveDemoSidebar
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/vue-stripe/vue-stripe' }],

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next'
    }
  },

  markdown: {
    theme: {
      // The high-contrast variants: github-light's orange, red and green tokens and
      // github-dark's comments (3.75:1) are under 4.5:1.
      light: 'github-light-high-contrast',
      dark: 'github-dark-high-contrast'
    }
  },

  vite: {
    ssr: {
      noExternal: ['@vue-stripe/vue-stripe']
    },
    resolve: {
      alias: [
        // "Last updated" with its date in the static HTML (theme/components/LastUpdated.vue).
        {
          find: /^.*\/VPDocFooterLastUpdated\.vue$/,
          replacement: fileURLToPath(new URL('./theme/components/LastUpdated.vue', import.meta.url))
        }
      ]
    },
    server: {
      fs: {
        allow: ['../..']
      }
    },
    // Explicitly define environment variables to ensure they're inlined during SSG build
    define: {
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
        getEnv('VITE_STRIPE_PUBLISHABLE_KEY')
      ),
      'import.meta.env.VITE_API_URL': JSON.stringify(
        getEnv('VITE_API_URL') || 'https://backend.vuestripe.com'
      ),
      'import.meta.env.VITE_GA_MEASUREMENT_ID': JSON.stringify(getEnv('VITE_GA_MEASUREMENT_ID'))
    }
  },

  srcDir: '.',
  outDir: '.vitepress/dist',
  cacheDir: '.vitepress/cache',
  cleanUrls: true,

  // Ignore dead links while building docs
  ignoreDeadLinks: false,

  // VitePress leaves the #app of 404.html empty, so without JavaScript (and until the app has
  // booted) a missing URL shows a blank page. Fill it with the server-rendered not-found page
  // (theme/components/NotFound.vue) and give it a real description.
  transformHtml(html, _id, { page, content }) {
    if (page !== '404.md') return
    return html
      .replace('<div id="app"></div>', () => `<div id="app">${content}</div>`)
      .replace(
        '<meta name="description" content="Not Found">',
        '<meta name="description" content="This page does not exist. Find the Vue Stripe tutorials, how-to guides, reference, explanation and live demos from here.">'
      )
  },

  // Canonical URL, robots, Open Graph / Twitter tags and JSON-LD for each page (./seo.ts).
  transformHead(context) {
    return seoHead(context, { sections: docSections, pkg, sidebars })
  },

  // Generate OG images at build time
  async buildEnd(siteConfig) {
    await buildEndGenerateOpenGraphImages({
      baseUrl: 'https://vuestripe.com',
      // The label above the title: the page's section ("How-to guides", "Reference").
      category: {
        byCustomGetter: (page) => (page.link ? ogCategory(page.link) : undefined),
        fallbackWithFrontmatter: false
      },
      // At the template's 64px, 22 characters of a mixed-case label fit beside the margins.
      maxCharactersPerLine: 22,
      templateSvgPath: './public/og-template.svg'
    })(siteConfig)
    finishOgTags(siteConfig.outDir, (route) => {
      const title = sidebarLabels.get(route)
      return title ? ogImageAlt({ title, category: ogCategory(route) }) : undefined
    })

    // /llms.txt, /llms-full.txt and a .md copy of every page (./llms.ts).
    const [usage, sizes] = await Promise.all([loadUsage(), loadBundleSizes()])
    writeLlmsFiles(siteConfig, {
      sections: docSections,
      sidebars,
      header: llmsHeader,
      components: {
        StripeCoverage: coverageMarkdown(coverage),
        // The same numbers the page was built with (one fetch per build).
        UsageStats: usageMarkdown(usage),
        ...bundleSizeMarkdown(sizes),
        // The home page's numbers: the usage figures, then the bundle size.
        HomeUsage: [homeUsageMarkdown(usage), homeBundleSizeMarkdown(sizes)]
          .filter(Boolean)
          .join('\n\n')
      }
    })
  }
})
