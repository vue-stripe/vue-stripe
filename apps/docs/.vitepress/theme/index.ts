import { h, defineComponent, nextTick, watch } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { createMermaidRenderer } from 'vitepress-mermaid-renderer'
import './styles/vars.css'
import StripeBadge from './components/StripeBadge.vue'
import CopyForLLM from './components/CopyForLLM.vue'
import GitHubStarsCTA from './components/GitHubStarsCTA.vue'
import StripeCoverage from './components/StripeCoverage.vue'

// Example components for interactive documentation
import ProductSelector from './components/examples/ProductSelector.vue'
import PaymentIntentGenerator from './components/examples/PaymentIntentGenerator.vue'
import ClientSecretInput from './components/examples/ClientSecretInput.vue'
import PaymentStatus from './components/examples/PaymentStatus.vue'
import PaymentElementExample from './components/examples/PaymentElementExample.vue'
import SubscriptionCheckoutExample from './components/examples/SubscriptionCheckoutExample.vue'
import SubscriptionEmbeddedExample from './components/examples/SubscriptionEmbeddedExample.vue'
import CheckoutRedirectExample from './components/examples/CheckoutRedirectExample.vue'
import CardElementExample from './components/examples/CardElementExample.vue'
import SplitCardElementExample from './components/examples/SplitCardElementExample.vue'
import LinkAuthenticationExample from './components/examples/LinkAuthenticationExample.vue'
import PaymentMethodMessagingExample from './components/examples/PaymentMethodMessagingExample.vue'
import AddressElementExample from './components/examples/AddressElementExample.vue'
import CreatePaymentMethodExample from './components/examples/CreatePaymentMethodExample.vue'
import SetupIntentExample from './components/examples/SetupIntentExample.vue'
import IbanElementExample from './components/examples/IbanElementExample.vue'
import ExpressCheckoutExample from './components/examples/ExpressCheckoutExample.vue'
import AuBankAccountPaymentExample from './components/examples/AuBankAccountPaymentExample.vue'

// Analytics composables
import { useScrollTracking } from './composables/useScrollTracking'
import { useSearchTracking } from './composables/useSearchTracking'
import { useCodeCopyTracking } from './composables/useCodeCopyTracking'
import { useLinkTracking } from './composables/useLinkTracking'
import { useUserPreferencesTracking } from './composables/useUserPreferencesTracking'
import { useErrorTracking } from './composables/useErrorTracking'
import { usePageTracking } from './composables/usePageTracking'

// Analytics wrapper component
const AnalyticsWrapper = defineComponent({
  name: 'AnalyticsWrapper',
  setup() {
    // Initialize all tracking composables
    useScrollTracking()
    useSearchTracking()
    useCodeCopyTracking()
    useLinkTracking()
    useUserPreferencesTracking()
    useErrorTracking()
    usePageTracking()

    return () => null
  }
})

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark } = useData()

    // Initialize Mermaid renderer with theme support
    const initMermaid = () => {
      createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'default',
      })
    }

    // Initial Mermaid setup
    nextTick(() => initMermaid())

    // Re-render Mermaid charts on theme change
    watch(
      () => isDark.value,
      () => initMermaid()
    )

    return h(DefaultTheme.Layout, null, {
      // Stripe Partner Badge above hero title on home page
      'home-hero-info-before': () => h(StripeBadge),
      // Copy for LLMs button near the title on doc pages
      'doc-before': () => h(CopyForLLM),
      // Analytics tracking (invisible component)
      'layout-top': () => h(AnalyticsWrapper),
      // GitHub stars CTA after hero actions
      'home-hero-actions-after': () => h(GitHubStarsCTA),
      // Carbon Ads placeholder - will be injected when you have the actual code
      // 'aside-ads-before': () => h('div', { id: 'carbon-ads-container' })
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Register example components globally for use in markdown
    app.component('ProductSelector', ProductSelector)
    app.component('PaymentIntentGenerator', PaymentIntentGenerator)
    app.component('ClientSecretInput', ClientSecretInput)
    app.component('PaymentStatus', PaymentStatus)
    app.component('PaymentElementExample', PaymentElementExample)
    app.component('SubscriptionCheckoutExample', SubscriptionCheckoutExample)
    app.component('SubscriptionEmbeddedExample', SubscriptionEmbeddedExample)
    app.component('CheckoutRedirectExample', CheckoutRedirectExample)
    app.component('CardElementExample', CardElementExample)
    app.component('SplitCardElementExample', SplitCardElementExample)
    app.component('LinkAuthenticationExample', LinkAuthenticationExample)
    app.component('PaymentMethodMessagingExample', PaymentMethodMessagingExample)
    app.component('AddressElementExample', AddressElementExample)
    app.component('CreatePaymentMethodExample', CreatePaymentMethodExample)
    app.component('SetupIntentExample', SetupIntentExample)
    app.component('IbanElementExample', IbanElementExample)
    app.component('ExpressCheckoutExample', ExpressCheckoutExample)
    app.component('StripeCoverage', StripeCoverage)
    app.component('AuBankAccountPaymentExample', AuBankAccountPaymentExample)
  }
} satisfies Theme