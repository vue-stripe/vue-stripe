<script setup lang="ts">
// The 404 page, in the layout's not-found slot. It is prerendered into 404.html (see
// transformHtml in config.ts), so a visitor without JavaScript and a crawler that follows a
// broken link get the same message and links. The section links come from the nav.
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import type { DefaultTheme } from 'vitepress/theme'

const { theme } = useData<DefaultTheme.Config>()

const sections = computed(() =>
  (theme.value.nav ?? []).filter(
    (item): item is DefaultTheme.NavItemWithLink => 'link' in item && item.link.startsWith('/')
  )
)
</script>

<template>
  <main id="main-content" class="not-found">
    <p class="code">404</p>
    <h1 class="title">Page not found</h1>
    <p class="text">
      There is no page at this address. It may have moved when the docs were reorganized for Vue
      Stripe 6. Search the docs with the Search button (Ctrl K), or start from a section:
    </p>
    <ul class="sections">
      <li v-for="item in sections" :key="item.link">
        <a :href="withBase(item.link)">{{ item.text }}</a>
      </li>
    </ul>
    <a class="home" :href="withBase('/')">Go to the home page</a>
  </main>
</template>

<style scoped>
.not-found {
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 24px 96px;
  text-align: center;
}

@media (min-width: 768px) {
  .not-found {
    padding: 96px 32px 128px;
  }
}

.code {
  line-height: 64px;
  font-size: 64px;
  font-weight: 600;
}

.title {
  padding-top: 12px;
  line-height: 32px;
  font-size: 24px;
  font-weight: 700;
}

.text {
  padding-top: 24px;
  line-height: 24px;
  color: var(--vp-c-text-1);
}

.sections {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 20px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.sections a,
.home {
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.home {
  display: inline-block;
  margin-top: 32px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 16px;
  padding: 3px 16px;
  font-size: 14px;
  text-decoration: none;
}
</style>
