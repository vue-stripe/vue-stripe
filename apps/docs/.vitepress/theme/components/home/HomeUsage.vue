<script setup lang="ts">
// Vue Stripe in numbers, under the hero: a row of usage figures and a row of bundle sizes.
// The build's usage numbers (../../data/usage.data.ts) are in the static HTML; in the browser
// they are fetched again, as on /usage, and updated in place. A figure that neither could
// fetch is left out, and with fewer than three left the usage row is not shown. The sizes are
// measured when the site is built (../../data/bundle-size.data.ts); a build without the
// library's dist has none, and leaves that row out. Each row counts up from 0 the first time
// it scrolls into view (../../composables/useCountUp.ts).
import { computed, onMounted, ref, shallowRef } from 'vue'
import { withBase } from 'vitepress'
import DocIcon, { type DocIconName } from '../DocIcon.vue'
import { data as built } from '../../data/usage.data'
import { data as sizes } from '../../data/bundle-size.data'
import { formatSizeLike, homeSizeFigures } from '../../data/bundle-size'
import { useCountUp } from '../../composables/useCountUp'
import {
  fetchUsage,
  formatCompact,
  formatCompactLike,
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
  /** The figure, and how to print it (also mid-count, as `format(n)`). */
  amount: number
  format: (n: number) => string
  label: string
}

const compactStat = (id: string, icon: DocIconName, amount: number, label: string): Stat => ({
  id,
  icon,
  amount,
  format: (n) => (n === amount ? formatCompact(n) : formatCompactLike(n, amount)),
  label
})
const countStat = (id: string, icon: DocIconName, amount: number, label: string): Stat => ({
  id,
  icon,
  amount,
  format: (n) => formatCount(Math.round(n)),
  label
})

const stats = computed(() => {
  const { npm, github } = usage.value
  const all: (Stat | null)[] = [
    npm.allTime !== null ? compactStat('all', 'package', npm.allTime, 'npm downloads') : null,
    npm.lastWeek !== null ? compactStat('week', 'package', npm.lastWeek, 'downloads a week') : null,
    github.stars !== null ? countStat('stars', 'star', github.stars, 'GitHub stars') : null,
    github.contributors !== null
      ? countStat('contributors', 'users', github.contributors, 'contributors')
      : null
  ]
  return all.filter((s): s is Stat => s !== null)
})

const SIZE_ICONS: Record<string, DocIconName> = {
  total: 'boxes',
  payment: 'shopping-cart',
  embedded: 'layout-template',
  'use-stripe': 'zap'
}
const sizeStats: Stat[] = homeSizeFigures(sizes).map((f) => ({
  id: f.id,
  icon: SIZE_ICONS[f.id] ?? 'package',
  amount: f.bytes,
  format: (n) => (n === f.bytes ? f.value : formatSizeLike(n, f.bytes)),
  label: f.label
}))

// Mid-count numbers for each row, or null to show the real values.
const usageRow = ref<HTMLElement | null>(null)
const sizeRow = ref<HTMLElement | null>(null)
const usageCount = useCountUp(usageRow, () => stats.value.map((s) => s.amount))
const sizeCount = useCountUp(sizeRow, () => sizeStats.map((s) => s.amount))
/** What the aria-hidden copy of figure `i` shows while its row counts, or null. */
const counted = (count: number[] | null, stat: Stat, i: number) => {
  const n = count?.[i]
  return n === undefined ? null : stat.format(n)
}
</script>

<template>
  <section
    v-if="stats.length >= 3 || sizeStats.length"
    class="home-usage"
    aria-labelledby="home-usage-title"
  >
    <h2 id="home-usage-title" class="visually-hidden">Vue Stripe in numbers</h2>
    <template v-if="stats.length >= 3">
      <ul
        ref="usageRow"
        class="home-usage-list"
        aria-label="Usage"
        :style="{ '--home-usage-count': stats.length }"
      >
        <li v-for="(s, i) in stats" :key="s.id" class="home-usage-stat">
          <span class="home-usage-value">
            <span :class="{ 'is-counting': counted(usageCount, s, i) !== null }">{{
              s.format(s.amount)
            }}</span>
            <span
              v-if="counted(usageCount, s, i) !== null"
              class="home-usage-count"
              aria-hidden="true"
              >{{ counted(usageCount, s, i) }}</span
            >
          </span>
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
    </template>
    <template v-if="sizeStats.length">
      <ul
        ref="sizeRow"
        class="home-usage-list"
        aria-label="Bundle size, minified and gzipped"
        :style="{ '--home-usage-count': sizeStats.length }"
      >
        <li v-for="(s, i) in sizeStats" :key="s.id" class="home-usage-stat">
          <span class="home-usage-value">
            <span :class="{ 'is-counting': counted(sizeCount, s, i) !== null }">{{
              s.format(s.amount)
            }}</span>
            <span
              v-if="counted(sizeCount, s, i) !== null"
              class="home-usage-count"
              aria-hidden="true"
              >{{ counted(sizeCount, s, i) }}</span
            >
          </span>
          <span class="home-usage-label">
            <DocIcon :name="s.icon" :size="14" />
            {{ s.label }}
          </span>
        </li>
      </ul>
      <p class="home-usage-more">
        <span>Minified and gzipped, tree-shaken. </span>
        <a :href="withBase('/guide/bundle-size')">How bundle size works</a>
      </p>
    </template>
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

/*
 * While a row counts, the real value stays in place but transparent: it keeps the cell's
 * width (no shifting) and is what screen readers read. The count is drawn over it.
 */
.home-usage-value {
  position: relative;
}

.home-usage-value .is-counting {
  color: transparent;
}

.home-usage-count {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
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
  white-space: nowrap;
  color: var(--vp-c-brand-1);
  font-weight: 500;
  text-decoration: none;
}

.home-usage-more a:hover {
  text-decoration: underline;
}

/* The bundle size row under the usage row. */
.home-usage-more + .home-usage-list {
  margin-top: 20px;
}
</style>
