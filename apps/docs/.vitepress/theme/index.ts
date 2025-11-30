import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './styles/vars.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Carbon Ads placeholder - will be injected when you have the actual code
      // 'aside-ads-before': () => h('div', { id: 'carbon-ads-container' })
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Register global components for documentation examples if needed
    // app.component('DemoContainer', DemoContainer)
  }
} satisfies Theme