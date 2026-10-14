<script setup lang="ts">
// Four usage figures under the hero. The build's numbers (../../data/usage.data.ts) are in the
// static HTML; in the browser they are fetched again, as on /usage, and updated in place. A
// figure that neither could fetch is left out, and with fewer than three left the strip is
// not shown at all.
import { computed, onMounted, shallowRef } from 'vue'
import { withBase } from 'vitepress'
import DocIcon, { type DocIconName } from '../DocIcon.vue'
import { data as built } from '../../data/usage.data'
import {
  fetchUsage,
  formatCompact,
  formatCount,
  formatDay,
  hasAnyFigure,
  mergeUsage,
  type UsageData
} from '../../data/usage'

const usage = shallowRef<UsageData>(built)

onMounted(() => {
  fetchUsage({ since: built })
    .then((fresh) => {
      if (hasAnyFigure(fresh)) usage.value = mergeUsage(usage.value, fresh)
    })
    // Offline or rate-limited: the build's numbers stay.
    .catch(() => {})
})

interface Stat {
  id: string
  icon: DocIconName
  value: string
  label: string
}

const stats = computed(() => {
  const { npm, github } = usage.value
  const all: (Stat | null)[] = [
    npm.allTime !== null
      ? { id: 'all', icon: 'package', value: formatCompact(npm.allTime), label: 'npm downloads' }
      : null,
    npm.lastWeek !== null
      ? {
          id: 'week',
          icon: 'package',
          value: formatCompact(npm.lastWeek),
          label: 'downloads a week'
        }
      : null,
    github.stars !== null
      ? { id: 'stars', icon: 'star', value: formatCount(github.stars), label: 'GitHub stars' }
      : null,
    github.contributors !== null
      ? {
          id: 'contributors',
          icon: 'users',
          value: formatCount(github.contributors),
          label: 'contributors'
        }
      : null
  ]
  return all.filter((s): s is Stat => s !== null)
})
</script>

<template>
  <section v-if="stats.length >= 3" class="home-usage" aria-labelledby="home-usage-title">
    <h2 id="home-usage-title" class="visually-hidden">Vue Stripe in numbers</h2>
    <ul class="home-usage-list" :style="{ '--home-usage-count': stats.length }">
      <li v-for="s in stats" :key="s.id" class="home-usage-stat">
        <span class="home-usage-value">{{ s.value }}</span>
        <span class="home-usage-label">
          <DocIcon :name="s.icon" :size="14" />
          {{ s.label }}
        </span>
      </li>
    </ul>
    <p class="home-usage-more">
      <a :href="withBase('/usage')">See all the numbers</a>
      <span v-if="usage.fetchedAt"> (updated {{ formatDay(usage.fetchedAt) }})</span>
    </p>
  </section>
</template>

<style scoped>
.home-usage {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 64px;
}

@media (min-width: 960px) {
  .home-usage {
    padding: 0 32px 64px;
  }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* One band split by dividers, so the figures read as a single row rather than more cards. */
.home-usage-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

@media (min-width: 768px) {
  .home-usage-list {
    grid-template-columns: repeat(var(--home-usage-count, 4), 1fr);
  }
}

.home-usage-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 20px 24px;
}

/* Dividers: vertical between columns, horizontal between the two rows on narrow screens. */
.home-usage-stat + .home-usage-stat {
  border-left: 1px solid var(--vp-c-divider);
}

@media (max-width: 767px) {
  .home-usage-stat:nth-child(odd) {
    border-left: 0;
  }

  .home-usage-stat:nth-child(n + 3) {
    border-top: 1px solid var(--vp-c-divider);
  }

  /* An odd last figure takes the whole row instead of leaving an empty cell. */
  .home-usage-stat:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
}

.home-usage-value {
  color: var(--vp-c-text-1);
  font-size: clamp(26px, 6vw, 34px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.home-usage-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 20px;
}

.home-usage-label :deep(svg) {
  flex: none;
  color: var(--vp-c-brand-1);
}

.home-usage-more {
  margin: 12px 0 0;
  color: var(--vp-c-text-3);
  font-size: 14px;
  text-align: right;
}

.home-usage-more a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  text-decoration: none;
}

.home-usage-more a:hover {
  text-decoration: underline;
}
</style>
