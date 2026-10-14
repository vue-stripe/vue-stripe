<script setup lang="ts">
// Replaces VitePress's VPDocFooterLastUpdated (aliased in config.ts). VitePress fills the date
// in only after mounting, in the reader's locale and time zone, so the static HTML had an
// empty <time>. A fixed locale and UTC give the same text on the server and in every browser,
// so the date is in the HTML and hydration has nothing to change.
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme, page } = useData()

const format = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })
const date = computed(() => new Date(page.value.lastUpdated!))
</script>

<template>
  <p class="VPLastUpdated">
    {{ theme.lastUpdated?.text || theme.lastUpdatedText || 'Last updated' }}:
    <time :datetime="date.toISOString()">{{ format.format(date) }}</time>
  </p>
</template>

<style scoped>
.VPLastUpdated {
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

@media (min-width: 640px) {
  .VPLastUpdated {
    line-height: 32px;
    font-size: 14px;
    font-weight: 500;
  }
}
</style>
