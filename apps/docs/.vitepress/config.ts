import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue Stripe',
  description: 'Stripe Elements for Vue.js - Vue 2 & 3 compatible',
  lang: 'en-US',
  base: '/',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#635bff' }],
    ['meta', { property: 'og:title', content: 'Vue Stripe' }],
    ['meta', { property: 'og:description', content: 'Stripe Checkout & Elements for Vue.js' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
  ],

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
            { text: 'StripeProvider', link: '/api/components/stripe-provider' },
            { text: 'StripeElements', link: '/api/components/stripe-elements' },
          ]
        },
        {
          text: 'Element Components',
          items: [
            { text: 'StripePaymentElement', link: '/api/components/stripe-payment-element' },
            { text: 'StripeExpressCheckoutElement', link: '/api/components/stripe-express-checkout-element' },
            { text: 'StripeCardElement', link: '/api/components/stripe-card-element' },
            { text: 'Split Card Elements', link: '/api/components/stripe-split-card-elements' },
            { text: 'StripeAddressElement', link: '/api/components/stripe-address-element' },
            { text: 'StripeLinkAuthenticationElement', link: '/api/components/stripe-link-authentication-element' },
          ]
        },
        {
          text: 'Checkout',
          items: [
            { text: 'StripeCheckout', link: '/api/components/stripe-checkout' },
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
      copyright: 'Copyright © 2024 Vue Stripe Contributors'
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
  ignoreDeadLinks: true
})
