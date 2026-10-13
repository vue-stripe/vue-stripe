<script setup lang="ts">
// Site footer, rendered in the layout-bottom slot on every page (it replaces VitePress's
// two-line footer). On pages with a sidebar it is indented like the content, so the fixed
// sidebar never covers it.
import { useData, withBase } from 'vitepress'
import { useSidebar } from 'vitepress/theme'
import StripeBadge from './StripeBadge.vue'

const { frontmatter } = useData()
const { hasSidebar } = useSidebar()

interface FooterLink {
  text: string
  link: string
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Learn',
    links: [
      { text: 'Take your first test payment', link: '/guide/first-payment' },
      { text: 'How-to guides', link: '/guide/' },
      { text: 'Choosing an integration', link: '/guide/approaches' },
      { text: 'Upgrade from v5 to v6', link: '/guide/migration-v6' }
    ]
  },
  {
    title: 'Reference',
    links: [
      { text: 'Components', link: '/api/#components' },
      { text: 'Composables', link: '/api/#composables' },
      { text: 'Types and errors', link: '/api/types' },
      { text: 'Stripe.js coverage', link: '/coverage' }
    ]
  },
  {
    title: 'Try it',
    links: [
      { text: 'Live demos', link: '/live-demo/' },
      { text: 'Playground', link: 'https://playground.vuestripe.com' },
      { text: 'Test cards and accounts', link: '/guide/testing' },
      { text: 'Troubleshooting', link: '/guide/troubleshooting' }
    ]
  },
  {
    title: 'Project',
    links: [
      { text: 'GitHub', link: 'https://github.com/vue-stripe/vue-stripe' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@vue-stripe/vue-stripe' },
      { text: 'Release notes', link: 'https://github.com/vue-stripe/vue-stripe/releases' },
      {
        text: 'Report an issue',
        link: 'https://github.com/vue-stripe/vue-stripe/issues/new/choose'
      },
      { text: 'Sponsor on Open Collective', link: 'https://opencollective.com/vue-stripe-checkout' }
    ]
  }
]

const isExternal = (link: string) => /^https?:/.test(link)
const href = (link: string) => (isExternal(link) ? link : withBase(link))
</script>

<template>
  <footer
    v-if="frontmatter['footer'] !== false"
    class="site-footer"
    :class="{ 'has-sidebar': hasSidebar }"
  >
    <div class="site-footer-inner">
      <div class="site-footer-brand">
        <a class="site-footer-name" :href="withBase('/')">
          <img
            :src="withBase('/vue-stripe-logo-variant-1-small.png')"
            alt=""
            width="28"
            height="28"
          />
          Vue Stripe
        </a>
        <p>
          Stripe Elements and Checkout as Vue components and composables, for Vue 3 and Vue 2.7 on
          Stripe.js 10.
        </p>
        <StripeBadge />
      </div>

      <nav class="site-footer-columns" aria-label="Footer">
        <div v-for="column in columns" :key="column.title" class="site-footer-column">
          <h2>{{ column.title }}</h2>
          <ul>
            <li v-for="item in column.links" :key="item.link">
              <a
                :href="href(item.link)"
                v-bind="
                  isExternal(item.link) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
                "
              >
                {{ item.text }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <div class="site-footer-legal">
      <p>
        Released under the MIT License. Copyright 2017-2026 Joff Tiquez &amp; Vue Stripe
        Contributors.
      </p>
      <p>Stripe and Stripe.js are trademarks of Stripe, Inc.</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  /* above the doc outline column and its fade (fixed, z-index 10), below the nav bar */
  z-index: 11;
  border-top: 1px solid var(--vp-c-gutter);
  background: var(--vp-c-bg-alt);
  padding: 48px 24px 32px;
}

@media (min-width: 768px) {
  .site-footer {
    padding: 56px 32px 32px;
  }
}

/* Same indent as VPContent, so the fixed sidebar never covers the footer. */
@media (min-width: 960px) {
  .site-footer.has-sidebar {
    padding-left: calc(var(--vp-sidebar-width) + 32px);
  }
}

@media (min-width: 1440px) {
  .site-footer.has-sidebar {
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width) + 32px);
  }
}

.site-footer-inner,
.site-footer-legal {
  max-width: 1152px;
  margin: 0 auto;
}

.site-footer.has-sidebar .site-footer-inner,
.site-footer.has-sidebar .site-footer-legal {
  margin-inline: 0;
}

.site-footer-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 40px;
}

@media (min-width: 960px) {
  .site-footer-inner {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
    gap: 48px;
  }

  /* Next to the sidebar there is less room: keep the brand above the links until 1280px */
  .site-footer.has-sidebar .site-footer-inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
}

@media (min-width: 1280px) {
  .site-footer.has-sidebar .site-footer-inner {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
    gap: 48px;
  }
}

.site-footer-name {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--vp-c-text-1);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
}

.site-footer-brand p {
  max-width: 36ch;
  margin: 12px 0 20px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}

.site-footer-brand :deep(.stripe-badge-link) {
  margin-bottom: 0;
}

.site-footer-brand :deep(.stripe-badge) {
  height: 32px;
}

.site-footer-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px 24px;
}

@media (min-width: 640px) {
  .site-footer-columns {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.site-footer-column h2 {
  margin: 0 0 12px;
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.site-footer-column ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.site-footer-column li + li {
  margin-top: 8px;
}

.site-footer-column a {
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.5;
  text-decoration: none;
  transition: color 0.15s;
}

.site-footer-column a:hover,
.site-footer-name:hover {
  color: var(--vp-c-brand-1);
}

.site-footer a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 2px;
}

.site-footer-legal {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 24px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--vp-c-divider);
}

.site-footer-legal p {
  margin: 0;
  color: var(--vp-c-text-3);
  font-size: 13px;
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .site-footer-column a {
    transition: none;
  }
}
</style>
