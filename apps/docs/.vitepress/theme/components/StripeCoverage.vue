<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import DocIcon from './DocIcon.vue'
import { coverage, type CoverageItem, type CoverageStatus } from '../data/stripe-coverage'
import { docLinks } from '../data/coverage-links'

type Filter = 'all' | 'covered' | 'deprecated'

const query = ref('')
const filter = ref<Filter>('all')

const all = coverage.flatMap((c) => c.items)
const count = (s: CoverageStatus) => all.filter((i) => i.status === s).length
const covered = count('covered')
const deprecated = count('deprecated')
const supported = all.length - deprecated
const percent = supported ? Math.floor((covered / supported) * 100) : 0

const slug = (group: string) =>
  group
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Everything a reader might type: the feature, the Stripe.js call, the Vue Stripe export,
// the group, and the type members the row accounts for (e.g. "collapse", "confirmPayment").
const haystack = (item: CoverageItem, group: string) =>
  [item.name, item.api, item.artifact ?? '', group, ...(item.surface ?? [])].join(' ').toLowerCase()

const groups = computed(() => {
  const terms = query.value.toLowerCase().split(/\s+/).filter(Boolean)
  return coverage
    .map((cat) => ({
      name: cat.group,
      id: slug(cat.group),
      items: cat.items
        .filter((item) => filter.value === 'all' || item.status === filter.value)
        .filter((item) => {
          const text = haystack(item, cat.group)
          return terms.every((t) => text.includes(t))
        })
        .map((item) => ({ ...item, links: docLinks(item.artifact) }))
    }))
    .filter((cat) => cat.items.length > 0)
})

const shown = computed(() => groups.value.reduce((n, g) => n + g.items.length, 0))

const FILTERS: { value: Filter; label: string; total: number }[] = [
  { value: 'all', label: 'All', total: all.length },
  { value: 'covered', label: 'Covered', total: covered },
  { value: 'deprecated', label: 'Deprecated', total: deprecated }
]

const reset = () => {
  query.value = ''
  filter.value = 'all'
}
</script>

<template>
  <div class="cov">
    <div class="cov-summary">
      <p class="cov-statement">
        <strong>{{ covered }} of {{ supported }}</strong> Stripe.js 10 elements and methods have a
        Vue Stripe component or composable. {{ deprecated }} more were removed by Stripe and are
        listed as deprecated.
      </p>
      <div
        class="cov-bar"
        role="progressbar"
        :aria-valuenow="percent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${percent}% of Stripe.js covered`"
      >
        <span class="cov-bar-fill" :style="{ width: percent + '%' }" />
      </div>
    </div>

    <div class="cov-toolbar">
      <label class="cov-search">
        <DocIcon name="search" :size="16" />
        <span class="visually-hidden">Search Stripe.js features</span>
        <input
          v-model="query"
          type="search"
          placeholder="Search by feature, Stripe.js method or Vue Stripe export"
          autocomplete="off"
          spellcheck="false"
        />
      </label>
      <div class="cov-filters" role="group" aria-label="Filter by status">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          type="button"
          class="cov-filter"
          :aria-pressed="filter === f.value"
          @click="filter = f.value"
        >
          {{ f.label }} <span class="cov-filter-count">{{ f.total }}</span>
        </button>
      </div>
    </div>

    <nav v-if="!query && filter === 'all'" class="cov-index" aria-label="Groups">
      <a v-for="g in groups" :key="g.id" :href="`#${g.id}`">
        {{ g.name }} <span>{{ g.items.length }}</span>
      </a>
    </nav>
    <p v-else class="cov-results" aria-live="polite">
      {{ shown }} {{ shown === 1 ? 'feature' : 'features' }} shown
    </p>

    <section v-for="g in groups" :id="g.id" :key="g.id" class="cov-group">
      <h2 class="cov-group-title">
        {{ g.name }}
        <a class="cov-anchor" :href="`#${g.id}`" :aria-label="`Link to ${g.name}`">#</a>
      </h2>
      <div class="cov-table" role="table" :aria-label="g.name">
        <div class="cov-row cov-head" role="row">
          <span role="columnheader">Feature</span>
          <span role="columnheader">Stripe.js</span>
          <span role="columnheader">Vue Stripe</span>
          <span role="columnheader">Docs</span>
        </div>
        <div
          v-for="item in g.items"
          :key="item.name"
          :class="['cov-row', `is-${item.status}`]"
          role="row"
        >
          <span class="cov-feature" role="cell">
            <DocIcon
              :name="item.status === 'covered' ? 'circle-check' : 'minus'"
              :size="16"
              :label="item.status === 'covered' ? 'Covered' : 'Deprecated'"
              class="cov-status"
            />
            <span>
              <span class="cov-name">{{ item.name }}</span>
              <span v-if="item.status === 'deprecated'" class="cov-badge">Deprecated</span>
              <span v-if="item.note" class="cov-note">{{ item.note }}</span>
            </span>
          </span>
          <span class="cov-api" role="cell"
            ><code>{{ item.api }}</code></span
          >
          <span class="cov-artifact" role="cell">
            <code v-if="item.artifact">{{ item.artifact }}</code>
            <span v-else class="cov-none">Not wrapped</span>
          </span>
          <span class="cov-links" role="cell">
            <a v-if="item.links.guide" :href="withBase(item.links.guide)">
              <DocIcon name="book-open" :size="14" />Guide
            </a>
            <span v-else class="cov-link-gap" />
            <a v-if="item.links.api" :href="withBase(item.links.api)">
              <DocIcon name="code" :size="14" />API
            </a>
            <span v-else class="cov-link-gap" />
            <a v-if="item.links.demo" :href="withBase(item.links.demo)">
              <DocIcon name="play" :size="14" />Demo
            </a>
            <span v-else class="cov-link-gap" />
          </span>
        </div>
      </div>
    </section>

    <div v-if="shown === 0" class="cov-empty">
      <p>
        Nothing matches <strong>{{ query }}</strong
        ><template v-if="filter !== 'all'"> in {{ filter }} features</template>. Try a Stripe.js
        method such as <code>confirmPayment</code> or an element such as <code>iban</code>.
      </p>
      <button type="button" class="cov-filter" @click="reset">Clear search</button>
    </div>
  </div>
</template>

<style scoped>
.cov {
  margin: 8px 0 48px;
  --cov-cols: minmax(0, 1.25fr) minmax(0, 1.2fr) minmax(0, 1.15fr) auto;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Summary */
.cov-statement {
  max-width: 64ch;
  margin: 0 0 12px;
  font-size: 17px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.cov-statement strong {
  color: var(--vp-c-text-1);
}

.cov-bar {
  height: 6px;
  max-width: 64ch;
  border-radius: 3px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}

.cov-bar-fill {
  display: block;
  height: 100%;
  background: var(--vp-c-brand-1);
}

/* Toolbar: stays under the nav while scrolling the long list */
.cov-toolbar {
  position: sticky;
  top: var(--vp-nav-height);
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  align-items: center;
  margin: 32px 0 12px;
  padding: 12px 0;
  background: var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-divider);
}

.cov-search {
  flex: 1 1 320px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  transition: border-color 0.15s;
}

.cov-search:focus-within {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.cov-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 15px;
  outline: none;
}

.cov-filters {
  display: flex;
  gap: 6px;
}

.cov-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.cov-filter:hover {
  color: var(--vp-c-text-1);
}

.cov-filter[aria-pressed='true'] {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.cov-filter:focus-visible,
.cov-links a:focus-visible,
.cov-index a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.cov-filter-count {
  /* text-2: the pressed chip's tint is too dark for text-3 */
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

/* Group index */
.cov-index {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  margin: 0 0 8px;
  font-size: 14px;
}

.cov-index a {
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.cov-index a:hover {
  color: var(--vp-c-brand-1);
}

.cov-index a span,
.cov-results {
  color: var(--vp-c-text-3);
  font-variant-numeric: tabular-nums;
}

.cov-results {
  margin: 0 0 8px;
  font-size: 14px;
}

/* Groups */
.cov-group {
  scroll-margin-top: calc(var(--vp-nav-height) + 80px);
}

.cov-group-title {
  margin: 40px 0 8px;
  padding: 0;
  border: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.cov-anchor {
  margin-left: 6px;
  color: var(--vp-c-text-3);
  font-weight: 400;
  text-decoration: none;
  opacity: 0;
  transition: opacity 0.15s;
}

.cov-group-title:hover .cov-anchor,
.cov-anchor:focus-visible {
  opacity: 1;
}

/* Rows */
.cov-row {
  display: grid;
  grid-template-columns: var(--cov-cols);
  gap: 16px;
  align-items: baseline;
  padding: 11px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 14px;
  line-height: 1.5;
}

.cov-head > span {
  justify-self: start;
  text-align: left;
}

.cov-head {
  padding: 6px 0;
  color: var(--vp-c-text-3);
  font-size: 13px;
  font-weight: 500;
}

.cov-feature {
  display: flex;
  gap: 8px;
  align-items: baseline;
  min-width: 0;
}

.cov-status {
  position: relative;
  top: 3px;
  color: var(--vp-c-brand-1);
}

.is-deprecated .cov-status {
  color: var(--vp-c-text-3);
}

.cov-name {
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.is-deprecated .cov-name {
  color: var(--vp-c-text-2);
}

.cov-badge {
  margin-left: 8px;
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.cov-note {
  display: block;
  margin-top: 2px;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.cov-api,
.cov-artifact {
  min-width: 0;
  overflow-wrap: anywhere;
}

.cov-api code,
.cov-artifact code {
  padding: 0;
  background: none;
  font-size: 13px;
}

.cov-api code {
  color: var(--vp-c-text-2);
}

.cov-artifact code {
  color: var(--vp-c-brand-1);
}

.cov-none {
  color: var(--vp-c-text-3);
}

.cov-links {
  display: grid;
  grid-template-columns: 72px 56px 64px;
  gap: 2px;
  white-space: nowrap;
}

.cov-links a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}

.cov-links a:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.cov-empty {
  margin: 32px 0;
  color: var(--vp-c-text-2);
}

/* Narrow screens: each row becomes a small stacked block */
@media (max-width: 768px) {
  .cov-head {
    display: none;
  }

  .cov-row {
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 14px 0;
  }

  .cov-api,
  .cov-artifact {
    padding-left: 24px;
  }

  .cov-links {
    display: flex;
    padding-left: 16px;
  }

  .cov-link-gap {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cov-search,
  .cov-anchor {
    transition: none;
  }
}
</style>
