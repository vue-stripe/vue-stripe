import { defineConfig } from 'vitepress'
import { buildEndGenerateOpenGraphImages } from '@nolebase/vitepress-plugin-og-image/vitepress'

// Google Analytics Measurement ID - Set via VITE_GA_MEASUREMENT_ID environment variable
const GA_MEASUREMENT_ID = process.env.VITE_GA_MEASUREMENT_ID || ''

export default defineConfig({
  title: 'Vue Stripe',
  description: 'Stripe Elements for Vue.js',
  lang: 'en-US',
  base: '/',

  head: [
    // Google Analytics
    ['script', { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}` }],
    ['script', {}, `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`],

    // Favicon
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'canonical', href: 'https://vuestripe.com/' }],

    // Basic meta
    ['meta', { name: 'theme-color', content: '#635bff' }],
    ['meta', { name: 'author', content: 'Vue Stripe Contributors' }],
    ['meta', { name: 'keywords', content: 'vue, stripe, payment, checkout, vue.js, vue 3, stripe elements, payment element, card element' }],

    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Vue Stripe' }],
    ['meta', { property: 'og:title', content: 'Vue Stripe' }],
    ['meta', { property: 'og:description', content: 'Stripe Checkout & Elements for Vue.js' }],
    ['meta', { property: 'og:url', content: 'https://vuestripe.com/' }],
    ['meta', { property: 'og:image', content: 'https://vuestripe.com/og-image.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],

    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Vue Stripe' }],
    ['meta', { name: 'twitter:description', content: 'Stripe Checkout & Elements for Vue.js' }],
    ['meta', { name: 'twitter:image', content: 'https://vuestripe.com/og-image.png' }],
  ],

  sitemap: {
    hostname: 'https://vuestripe.com'
  },

  themeConfig: {
    logo: { src: '/vue-stripe-logo-variant-1-small.png', alt: 'Vue Stripe' },

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API', link: '/api/' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/vue-stripe/vue-stripe' },
          { text: 'NPM', link: 'https://www.npmjs.com/package/@vue-stripe/vue-stripe' },
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Your First Payment', link: '/guide/first-payment' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Choosing Your Approach', link: '/guide/approaches' },
          ]
        },
        {
          text: 'Payment Elements',
          items: [
            { text: 'Payment Element', link: '/guide/payment-element' },
            { text: 'Card Element', link: '/guide/card-element' },
            { text: 'Address Element', link: '/guide/address-element' },
            { text: 'Link Authentication', link: '/guide/link-authentication' },
            { text: 'Express Checkout', link: '/guide/express-checkout' },
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Saving Payment Methods', link: '/guide/setup-intent' },
            { text: 'Checkout', link: '/guide/checkout' },
          ]
        },
      ],
      '/api/': [
        {
          text: 'Overview',
          items: [
            { text: 'API Reference', link: '/api/' },
          ]
        },
        {
          text: 'Provider Components',
          items: [
            { text: 'VueStripeProvider', link: '/api/components/stripe-provider' },
            { text: 'VueStripeElements', link: '/api/components/stripe-elements' },
          ]
        },
        {
          text: 'Element Components',
          items: [
            { text: 'VueStripePaymentElement', link: '/api/components/stripe-payment-element' },
            { text: 'VueStripeExpressCheckoutElement', link: '/api/components/stripe-express-checkout-element' },
            { text: 'VueStripeCardElement', link: '/api/components/stripe-card-element' },
            { text: 'Split Card Elements', link: '/api/components/stripe-split-card-elements' },
            { text: 'VueStripeAddressElement', link: '/api/components/stripe-address-element' },
            { text: 'VueStripeLinkAuthenticationElement', link: '/api/components/stripe-link-authentication-element' },
          ]
        },
        {
          text: 'Checkout',
          items: [
            { text: 'VueStripeCheckout', link: '/api/components/stripe-checkout' },
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
          ]
        },
        {
          text: 'Plugin',
          items: [
            { text: 'createVueStripe', link: '/api/plugin' },
          ]
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vue-stripe/vue-stripe' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Vue Stripe Contributors'
    },

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
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
  },

  vite: {
    ssr: {
      noExternal: ['@vue-stripe/vue-stripe']
    },
    server: {
      fs: {
        allow: ['../..']
      }
    }
  },

  srcDir: '.',
  outDir: '.vitepress/dist',
  cacheDir: '.vitepress/cache',
  cleanUrls: true,

  // Ignore dead links while building docs
  ignoreDeadLinks: true,

  // Generate OG images at build time
  async buildEnd(siteConfig) {
    await buildEndGenerateOpenGraphImages({
      baseUrl: 'https://vuestripe.com',
      category: {
        byLevel: 2,
      },
      templateSvgPath: './public/og-template.svg',
    })(siteConfig)
  },
})
