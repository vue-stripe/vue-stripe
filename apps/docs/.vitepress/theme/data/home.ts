// The home page's copy. The home page components render it, and the build writes it to
// /index.md and /llms-full.txt (../../llms.ts), so the page and its Markdown copy say the same.
import type { DocIconName } from '../components/DocIcon.vue'

export const HERO = {
  name: 'Vue Stripe',
  // Shown after the name in the hero only (the Stripe.js 10 release name)
  nameAccent: 'Endive',
  title: 'Stripe Elements and Checkout as Vue components',
  lede: 'Components and composables for every Stripe.js element and method, typed and tested on Vue 3 and Vue 2.7. Drop a provider into your app, render the Payment Element, and confirm with one composable.',
  actions: [
    { text: 'Get started', link: '/guide/first-payment' },
    { text: 'Try the live demos', link: '/live-demo/' }
  ],
  notice: {
    text: 'Now on Stripe.js 10 (Endive)',
    link: '/guide/migration-v6',
    linkText: 'What changed in v6'
  }
}

/** The files of the hero's example project; index.md passes each one's code in a slot. */
export const HERO_FILES: {
  id: 'checkout' | 'paybutton' | 'server'
  name: string
  folder: string
  language: string
}[] = [
  { id: 'checkout', name: 'CheckoutPage.vue', folder: 'src', language: 'Vue' },
  { id: 'paybutton', name: 'PayButton.vue', folder: 'src', language: 'Vue' },
  { id: 'server', name: 'server.mjs', folder: '', language: 'JavaScript' }
]

export const FEATURES: { icon: DocIconName; title: string; text: string; link?: string }[] = [
  {
    icon: 'layers',
    title: 'Vue 3 and Vue 2.7',
    text: 'One build for both. Render-function components and composables, tested on each version in CI.'
  },
  {
    icon: 'credit-card',
    title: 'Every Stripe element',
    text: 'Payment, Express Checkout, Card, Address, Link, IBAN, BECS, Tax ID, Currency Selector, Issuing and more.',
    link: '/api/'
  },
  {
    icon: 'shopping-cart',
    title: 'Every Checkout',
    text: 'Hosted, Embedded and Custom Checkout, the Checkout Form and the Pricing Table.',
    link: '/guide/approaches'
  },
  {
    icon: 'zap',
    title: 'A composable per method',
    text: 'usePaymentIntent, one useConfirm composable per payment method, tokens, Financial Connections and Identity.',
    link: '/guide/confirming-payments'
  },
  {
    icon: 'shield-check',
    title: 'Typed end to end',
    text: 'Props, events, exposed members and results are typed from Stripe.js, and every Stripe type you need is re-exported.'
  },
  {
    icon: 'gauge',
    title: '100% of Stripe.js 10',
    text: 'Every element and method has a wrapper. A test fails the build when Stripe adds something new.',
    link: '/coverage'
  }
]

export const INTEGRATIONS_TITLE = 'Pick how you take payments'
export const INTEGRATIONS_LEDE =
  'Six ways to put Stripe in a Vue app, from a single element to a full checkout page.'
export const INTEGRATIONS_COMPARE = { text: 'Compare them', link: '/guide/approaches' }

export const INTEGRATIONS: {
  icon: DocIconName
  title: string
  text: string
  component: string
  guide: string
  demo?: string
}[] = [
  {
    icon: 'credit-card',
    title: 'Payment Element on your page',
    text: 'Cards, wallets and local payment methods in one form, confirmed against a PaymentIntent.',
    component: 'VueStripePaymentElement',
    guide: '/guide/payment-element',
    demo: '/live-demo/payment-element'
  },
  {
    icon: 'layout-template',
    title: 'Custom Checkout',
    text: 'Your own layout on a Checkout Session. Stripe keeps line items, tax, discounts and currency.',
    component: 'VueStripeCheckoutElementsProvider',
    guide: '/guide/custom-checkout',
    demo: '/live-demo/custom-checkout'
  },
  {
    icon: 'panel-top',
    title: 'Embedded Checkout',
    text: "Stripe's prebuilt checkout page, mounted inside your page.",
    component: 'VueStripeEmbeddedCheckout',
    guide: '/guide/embedded-checkout',
    demo: '/live-demo/embedded-checkout'
  },
  {
    icon: 'external-link',
    title: 'Hosted Checkout',
    text: 'Redirect to checkout.stripe.com with the session URL your server creates.',
    component: 'VueStripeCheckout',
    guide: '/guide/checkout',
    demo: '/live-demo/checkout-redirect'
  },
  {
    icon: 'receipt',
    title: 'Checkout Form',
    text: 'A complete checkout form from one component, on a Checkout Session. Stripe beta.',
    component: 'VueStripeCheckoutForm',
    guide: '/guide/checkout-form',
    demo: '/live-demo/checkout-form'
  },
  {
    icon: 'columns',
    title: 'Pricing Table',
    text: 'A pricing table you configure in the Stripe Dashboard, embedded with one tag.',
    component: 'VueStripePricingTable',
    guide: '/guide/pricing-table'
  }
]
