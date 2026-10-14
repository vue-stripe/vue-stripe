<script setup lang="ts">
// The numbers on /usage. The build fetches them (../data/usage.data.ts), so the page works
// without JavaScript; in the browser they are fetched again and updated in place. A figure the
// browser cannot fetch keeps the build's number, and the page says how old its numbers are.
import { computed, onMounted, ref, shallowRef } from 'vue'
import DocIcon, { type DocIconName } from './DocIcon.vue'
import UsageChart from './UsageChart.vue'
import { data as built } from '../data/usage.data'
import {
  DEPENDENTS_PAGE,
  GITHUB_PAGE,
  JSDELIVR_PAGE,
  LEGACY_NPM_PAGE,
  LEGACY_PACKAGE,
  LEGACY_PACKAGE_CREATED,
  NPM_PAGE,
  PACKAGE,
  PACKAGE_CREATED,
  fetchUsage,
  formatCount,
  formatDay,
  formatMonth,
  hasAnyFigure,
  mergeUsage,
  usageFigures,
  type UsageData
} from '../data/usage'

const usage = shallowRef<UsageData>(built)
const live = ref(false)

onMounted(() => {
  fetchUsage({ since: built })
    .then((fresh) => {
      if (!hasAnyFigure(fresh)) return
      usage.value = mergeUsage(usage.value, fresh)
      live.value = true
    })
    // Offline or blocked: the build's numbers stay.
    .catch(() => {})
})

const available = computed(() => hasAnyFigure(usage.value))
const allTime = computed(() => usage.value.npm.allTime)
const legacy = computed(() => usage.value.legacy.allTime)
const combined = computed(() =>
  allTime.value !== null && legacy.value !== null ? allTime.value + legacy.value : null
)

const ICONS: Record<string, DocIconName> = {
  year: 'package',
  month: 'package',
  week: 'package',
  cdn: 'globe',
  stars: 'star',
  forks: 'git-fork',
  contributors: 'users'
}
const figures = computed(() => usageFigures(usage.value))
</script>

<template>
  <div class="usage">
    <section v-if="!available" class="usage-unavailable" aria-labelledby="usage-unavailable">
      <DocIcon name="info" :size="22" />
      <div>
        <h2 id="usage-unavailable">Live numbers unavailable</h2>
        <p>
          npm, GitHub and jsDelivr could not be reached when this page was built or from your
          browser. Each of them shows its own numbers:
        </p>
        <ul>
          <li>
            <a :href="NPM_PAGE" target="_blank" rel="noopener noreferrer">{{ PACKAGE }} on npm</a>
          </li>
          <li>
            <a :href="GITHUB_PAGE" target="_blank" rel="noopener noreferrer">
              vue-stripe/vue-stripe on GitHub
            </a>
          </li>
          <li>
            <a :href="JSDELIVR_PAGE" target="_blank" rel="noopener noreferrer">
              {{ PACKAGE }} on jsDelivr
            </a>
          </li>
        </ul>
      </div>
    </section>

    <template v-else>
      <section class="usage-hero" aria-labelledby="usage-hero-label">
        <div class="usage-hero-main">
          <p id="usage-hero-label" class="usage-eyebrow">npm downloads, all time</p>
          <p v-if="allTime !== null" class="usage-total">{{ formatCount(allTime) }}</p>
          <p v-else class="usage-total usage-total--missing">Not available right now</p>
          <p class="usage-hero-text">
            Downloads of
            <a :href="NPM_PAGE" target="_blank" rel="noopener noreferrer">
              <code>{{ PACKAGE }}</code>
            </a>
            since its first release in {{ formatMonth(PACKAGE_CREATED) }}.
          </p>
        </div>
        <div v-if="combined !== null && legacy !== null" class="usage-hero-side">
          <p class="usage-eyebrow">Including the legacy package</p>
          <p class="usage-combined">{{ formatCount(combined) }}</p>
          <p class="usage-hero-text">
            With
            <a :href="LEGACY_NPM_PAGE" target="_blank" rel="noopener noreferrer">
              <code>{{ LEGACY_PACKAGE }}</code>
            </a>
            ({{ formatCount(legacy) }} downloads), the package Vue Stripe started as in
            {{ formatMonth(LEGACY_PACKAGE_CREATED) }}.
          </p>
        </div>
        <p v-if="usage.fetchedAt" class="usage-updated">
          <span>
            <span class="usage-updated-dot" :class="{ 'is-live': live }" aria-hidden="true" />
            Updated {{ formatDay(usage.fetchedAt) }}
            <template v-if="usage.npm.through">
              (npm counts run through {{ formatDay(usage.npm.through) }})
            </template>
          </span>
          <span class="usage-updated-source">
            {{ live ? 'Refreshed in your browser' : 'From the last site build' }}
          </span>
        </p>
      </section>

      <ul class="usage-figures">
        <li v-for="figure in figures" :key="figure.id" class="usage-figure">
          <p class="usage-figure-label">
            <DocIcon :name="ICONS[figure.id] ?? 'hash'" :size="16" />
            {{ figure.label }}
          </p>
          <p v-if="figure.value !== null" class="usage-figure-value">
            {{ formatCount(figure.value) }}
          </p>
          <p v-else class="usage-figure-value usage-figure-value--missing">Not available</p>
          <p v-if="figure.detail" class="usage-figure-detail">{{ figure.detail }}</p>
          <a
            class="usage-figure-source"
            :href="figure.sourceLink"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ figure.source }}
          </a>
        </li>
        <li class="usage-figure usage-figure--link">
          <p class="usage-figure-label">
            <DocIcon name="network" :size="16" />
            Dependents
          </p>
          <p class="usage-figure-detail">
            GitHub lists the repositories and packages that depend on Vue Stripe.
          </p>
          <a
            class="usage-figure-source"
            :href="DEPENDENTS_PAGE"
            target="_blank"
            rel="noopener noreferrer"
          >
            See them on GitHub
          </a>
        </li>
      </ul>

      <section
        v-if="usage.npm.weekly.length > 1"
        class="usage-trend"
        aria-labelledby="usage-trend-title"
      >
        <h2 id="usage-trend-title">Weekly npm downloads</h2>
        <p class="usage-trend-lede">
          Downloads of <code>{{ PACKAGE }}</code> in each of the past
          {{ usage.npm.weekly.length }} weeks.
        </p>
        <UsageChart :weeks="usage.npm.weekly" label="Weekly npm downloads of Vue Stripe" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.usage {
  --usage-surface: var(--vp-c-bg-soft);
  margin-top: 32px;
}

.usage p {
  margin: 0;
  line-height: 1.5;
}

.usage h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 20px;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

.usage-eyebrow {
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* Hero: the all-time total, with the legacy package beside it */
.usage-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  padding: 32px 24px 24px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background:
    radial-gradient(120% 140% at 0% 0%, var(--vp-c-brand-soft), transparent 60%),
    var(--vp-c-bg-soft);
}

@media (min-width: 768px) {
  .usage-hero {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    align-items: end;
    padding: 40px 40px 28px;
  }
}

.usage-total {
  margin-top: 8px !important;
  color: var(--vp-c-text-1);
  font-size: clamp(44px, 12vw, 80px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  line-height: 1 !important;
}

.usage-total--missing {
  font-size: 28px;
  color: var(--vp-c-text-2);
}

.usage-hero-text {
  max-width: 48ch;
  margin-top: 12px !important;
  color: var(--vp-c-text-2);
  font-size: 15px;
}

.usage-hero-side {
  padding-top: 20px;
  border-top: 1px solid var(--vp-c-divider);
}

@media (min-width: 768px) {
  .usage-hero-side {
    padding: 0 0 0 28px;
    border-top: 0;
    border-left: 1px solid var(--vp-c-divider);
  }
}

.usage-combined {
  margin-top: 6px !important;
  color: var(--vp-c-text-1);
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.1 !important;
}

.usage-updated {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  grid-column: 1 / -1;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.usage-updated-dot {
  display: inline-block;
  margin-right: 6px;
  vertical-align: 1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
}

.usage-updated-dot.is-live {
  background: var(--vp-c-green-1);
  box-shadow: 0 0 0 3px var(--vp-c-green-soft);
}

.usage-updated-source {
  margin-left: auto;
  color: var(--vp-c-text-3);
}

/* Figures */
.usage-figures {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0 0 !important;
  padding: 0 !important;
  list-style: none;
}

@media (min-width: 768px) {
  .usage-figures {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.usage-figure {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin: 0 !important;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.usage-figure-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.35 !important;
}

.usage-figure-label :deep(.doc-icon) {
  color: var(--vp-c-brand-1);
}

.usage-figure-value {
  color: var(--vp-c-text-1);
  font-size: clamp(22px, 6vw, 28px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.15 !important;
}

.usage-figure-value--missing {
  color: var(--vp-c-text-3);
  font-size: 16px;
  font-weight: 500;
}

.usage-figure-detail {
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.usage-figure-source {
  margin-top: auto;
  padding-top: 4px;
  color: var(--vp-c-text-3) !important;
  font-size: 12px;
  font-weight: 500 !important;
  text-decoration: none !important;
}

.usage-figure-source:hover {
  color: var(--vp-c-brand-1) !important;
}

.usage-figure--link .usage-figure-source {
  color: var(--vp-c-brand-1) !important;
  font-size: 13px;
}

/* Weekly chart */
.usage-trend {
  margin-top: 16px;
  padding: 24px 20px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--usage-surface);
}

@media (min-width: 768px) {
  .usage-trend {
    padding: 28px 32px 24px;
  }
}

.usage-trend-lede {
  margin: 4px 0 20px !important;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

/* Fallback when no number could be fetched */
.usage-unavailable {
  display: flex;
  gap: 14px;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
}

.usage-unavailable > :deep(.doc-icon) {
  margin-top: 2px;
  color: var(--vp-c-text-2);
}

.usage-unavailable p {
  margin-top: 6px !important;
  color: var(--vp-c-text-2);
}

.usage-unavailable ul {
  margin: 12px 0 0 !important;
}
</style>
