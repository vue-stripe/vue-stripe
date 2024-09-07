import { defineConfig, loadEnv } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    title: 'Vue Stripe 💳',
    description: 'The official partner Stripe component library for Vue.js',
    head: [
      [
        'link', 
        { rel: 'icon', href: '/favicon.ico' }
      ]
    ],
    themeConfig: {
      lastUpdated: true,

      search: {
        provider: 'local'
      },

      carbonAds: {
        code: 'CEBIEK3Y',
        placement: 'vuestripecom'
      },


      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: 'Home', link: '/' },
        { text: 'OSSPH', link: 'https://ossph.org' },
        // { text: 'Twitter', link: 'https://twitter.com/jrtiquez' },
      ],

      sidebar: [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Vue Stripe', link: '/introduction' },
            { text: 'Understanding Stripe.js', link: '/understanding-stripe-js' },
            { text: 'Getting Started', link: '/getting-started' }
          ]
        },
        {
          text: 'Composables',
          items: [
            { text: 'useStripe', link: '/composables/use-stripe' },
          ]
        },
        {
          text: 'Components',
          items: [
            { text: 'Payment Element', link: '/components/payment-element' },
            { text: 'Express Checkout Element', link: '/components/express-checkout-element' },
            { text: 'Link Authentication Element', link: '/components/link-authentication-element' },
            // { text: 'Address Element', link: '/components/address-element' },
          ]
        },
        {
          text: 'FAQs',
          items: [
            { text: 'How to get a publishable key?', link: '/faqs/publishable-key' },
            { text: 'What is a client secret?', link: '/faqs/client-secret' },
          ]
        },
        {
          text: 'Vue 2 Support',
          items: [
            { text: 'Intro', link: '/vue-2/introduction' },
          ]
        }
      ],

      socialLinks: [
        { icon: 'x', link: 'https://twitter.com/jrtiquez' },
        { icon: 'github', link: 'https://github.com/vue-stripe' },
      ],

      footer: {
        copyright: 'Copyright © 2016 - present Joff Tiquez',
        message: 'Released under the MIT License.',
      },

      editLink: {
        pattern: 'https://github.com/vue-stripe/docs/edit/main/:path',
        text: 'Suggest changes',
      },
    },
    vite: {
      define: {
        __APP_ENV__: JSON.stringify(env.APP_ENV),
      },
    },
    cleanUrls: 'with-subfolders',
  };
});
