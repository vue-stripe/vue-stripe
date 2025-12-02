import { h, defineComponent } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './styles/vars.css'
import StripeBadge from './components/StripeBadge.vue'

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
    return h(DefaultTheme.Layout, null, {
      // Stripe Partner Badge below hero actions on home page
      'home-hero-info-after': () => h(StripeBadge),
      // Analytics tracking (invisible component)
      'layout-top': () => h(AnalyticsWrapper),
      // Carbon Ads placeholder - will be injected when you have the actual code
      // 'aside-ads-before': () => h('div', { id: 'carbon-ads-container' })
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Register global components for documentation examples if needed
    // app.component('DemoContainer', DemoContainer)
  }
} satisfies Theme