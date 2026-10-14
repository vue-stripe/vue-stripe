<script setup lang="ts">
// The numbers on /guide/bundle-size, one part of the page per `part`. The build measures them
// from the library's dist (../data/bundle-size.data.ts), so they are in the static HTML and
// match the version built. Without a built library only the summary renders, as a fallback.
// llms.ts (bundleSizeMarkdown) writes the same parts for the page's Markdown copy.
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import DocIcon, { type DocIconName } from './DocIcon.vue'
import { data } from '../data/bundle-size.data'
import {
  addedRange,
  combination,
  exportSize,
  formatMeasuredAt,
  formatSize,
  groupExports,
  hasSizes
} from '../data/bundle-size'

const props = defineProps<{
  part: 'summary' | 'combinations' | 'elements' | 'other' | 'budgets' | 'table'
}>()

const available = hasSizes(data)
const total = data.total?.gzip ?? 0
/** Share of the whole library, for the bars. */
const share = (bytes: number) => `${Math.max(1, Math.min(100, (bytes / total) * 100)).toFixed(1)}%`
const percent = (bytes: number) => `${Math.round((bytes / total) * 100)}%`

const measured = computed(() =>
  data.measuredAt
    ? `Measured for ${data.version ?? 'this version'} on ${formatMeasuredAt(data.measuredAt)} with ${data.bundler ?? 'Rolldown'}.`
    : ''
)

const payment = combination(data, 'payment-element')
const useStripe = exportSize(data, 'useStripe')

interface Figure {
  id: string
  icon: DocIconName
  value: string
  label: string
}
const figures: Figure[] = [
  ...(data.total
    ? [
        {
          id: 'total',
          icon: 'boxes',
          value: formatSize(total),
          label: 'The whole library'
        } as const
      ]
    : []),
  ...(payment
    ? [
        {
          id: 'payment',
          icon: 'shopping-cart',
          value: formatSize(payment.size.gzip),
          label: 'A Payment Element checkout'
        } as const
      ]
    : []),
  ...(useStripe
    ? [
        {
          id: 'use-stripe',
          icon: 'zap',
          value: formatSize(useStripe.gzip),
          label: 'useStripe alone'
        } as const
      ]
    : [])
]

const range = addedRange(data.exports)
const elements = data.elements
const shared = elements ? elements.first - elements.own : 0

const query = ref('')
const groups = computed(() => {
  const terms = query.value.toLowerCase().split(/\s+/).filter(Boolean)
  return groupExports(data.exports)
    .map((group) => ({
      ...group,
      exports: group.exports.filter((e) => {
        const text = `${e.name} ${e.aliasOf ?? ''} ${group.title}`.toLowerCase()
        return terms.every((t) => text.includes(t))
      })
    }))
    .filter((group) => group.exports.length > 0)
})
const shown = computed(() => groups.value.reduce((n, g) => n + g.exports.length, 0))
/** `VueStripeCardElement` -> `Vue`, `Stripe`, `Card`, `Element`: a long name may wrap between them. */
const words = (name: string) => name.split(/(?=[A-Z])/)
</script>

<template>
  <div v-if="props.part === 'summary'" class="size">
    <section v-if="!available" class="size-unavailable" aria-labelledby="size-unavailable">
      <DocIcon name="info" :size="22" />
      <div>
        <p id="size-unavailable" class="size-unavailable-title">
          Sizes are measured when the site is built
        </p>
        <p>
          This build of the site ran without the library's <code>dist</code>, so it has no numbers.
          Build the library first (<code>pnpm vue-stripe:build</code>), or see the CI budgets in
          <code>packages/vue-stripe/.size-limit.json</code>.
        </p>
      </div>
    </section>

    <template v-else>
      <ul class="size-figures">
        <li v-for="f in figures" :key="f.id" class="size-figure">
          <p class="size-figure-label">
            <DocIcon :name="f.icon" :size="16" />
            {{ f.label }}
          </p>
          <p class="size-figure-value">{{ f.value }}</p>
        </li>
      </ul>
      <div v-if="payment" class="size-share">
        <div class="size-bar" aria-hidden="true">
          <span class="size-bar-fill" :style="{ width: share(payment.size.gzip) }" />
        </div>
        <p>
          A Payment Element checkout is {{ percent(payment.size.gzip) }} of the library. The rest
          stays out of your bundle.
        </p>
      </div>
      <p class="size-meta">
        Minified and gzipped, without Vue and <code>@stripe/stripe-js</code>. {{ measured }}
      </p>
    </template>
  </div>

  <div v-else-if="available && props.part === 'combinations'" class="size">
    <div class="size-scroll">
      <table class="size-table">
        <thead>
          <tr>
            <th scope="col">Integration and its imports</th>
            <th scope="col" class="size-num size-min">Minified</th>
            <th scope="col" class="size-num">Gzipped</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in data.combinations" :key="c.id">
            <th scope="row">
              {{ c.title }}
              <span class="size-imports">
                <code v-for="name in c.imports" :key="name">{{ name }}</code>
              </span>
            </th>
            <td class="size-num size-min">{{ formatSize(c.size.minified, 2) }}</td>
            <td class="size-num">
              <span class="size-strong">{{ formatSize(c.size.gzip, 2) }}</span>
              <span class="size-bar size-bar--row" aria-hidden="true">
                <span class="size-bar-fill" :style="{ width: share(c.size.gzip) }" />
              </span>
              <span class="size-row-share">{{ percent(c.size.gzip) }} of the library</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-else-if="available && props.part === 'elements' && elements && range" class="size">
    <div class="size-elements">
      <div class="size-element-row">
        <p class="size-element-label">
          <strong>The first element</strong>
          <span
            ><code>{{ elements.base }}</code> on its own</span
          >
        </p>
        <div class="size-stack" aria-hidden="true">
          <span
            class="size-stack-shared"
            :style="{ width: `${(shared / elements.first) * 100}%` }"
          />
          <span
            class="size-stack-own"
            :style="{ width: `${(elements.own / elements.first) * 100}%` }"
          />
        </div>
        <p class="size-element-value">{{ formatSize(elements.first, 2) }}</p>
      </div>
      <div class="size-element-row">
        <p class="size-element-label">
          <strong>Each element after it</strong>
          <span>its own definition, median of every element</span>
        </p>
        <div class="size-stack" aria-hidden="true">
          <span
            class="size-stack-own"
            :style="{ width: `${(range.median / elements.first) * 100}%` }"
          />
        </div>
        <p class="size-element-value">{{ formatSize(range.median) }}</p>
      </div>
      <ul class="size-legend">
        <li>
          <span class="size-swatch size-swatch--shared" aria-hidden="true" />
          Element factory and provider plumbing, shared: {{ formatSize(shared, 2) }}
        </li>
        <li>
          <span class="size-swatch size-swatch--own" aria-hidden="true" />
          One element's own definition: {{ formatSize(elements.own) }} for the Payment Element,
          {{ formatSize(range.min) }} to {{ formatSize(range.max) }} across all of them ({{
            formatSize(range.median)
          }}
          median)
        </li>
      </ul>
    </div>
  </div>

  <div v-else-if="available && props.part === 'other'" class="size">
    <div class="size-scroll">
      <table class="size-table">
        <thead>
          <tr>
            <th scope="col">Not in the import sizes</th>
            <th scope="col" class="size-num size-min">Size</th>
            <th scope="col" class="size-num">Gzipped</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data.stylesheet">
            <th scope="row">
              Stylesheet, <code>@vue-stripe/vue-stripe/style.css</code>
              <span class="size-row-note">Imported once by your app</span>
            </th>
            <td class="size-num size-min">{{ formatSize(data.stylesheet.raw, 2) }}</td>
            <td class="size-num size-strong">{{ formatSize(data.stylesheet.gzip, 2) }}</td>
          </tr>
          <tr v-if="data.stripeLoader">
            <th scope="row">
              <code>@stripe/stripe-js</code> {{ data.stripeLoader.version }} loader, minified
              <span class="size-row-note">
                The <code>pure</code> entry; a peer dependency in your app, not part of Vue Stripe
              </span>
            </th>
            <td class="size-num size-min">{{ formatSize(data.stripeLoader.size.minified, 2) }}</td>
            <td class="size-num size-strong">{{ formatSize(data.stripeLoader.size.gzip, 2) }}</td>
          </tr>
          <tr v-if="data.builds.cjs">
            <th scope="row">
              CommonJS build, <code>dist/cjs/index.cjs</code>
              <span class="size-row-note">Every export; does not tree-shake</span>
            </th>
            <td class="size-num size-min">{{ formatSize(data.builds.cjs.minified, 2) }}</td>
            <td class="size-num size-strong">{{ formatSize(data.builds.cjs.gzip, 2) }}</td>
          </tr>
          <tr v-if="data.builds.umd">
            <th scope="row">
              UMD build, <code>dist/umd/index.js</code>
              <span class="size-row-note">Every export, for a script tag; does not tree-shake</span>
            </th>
            <td class="size-num size-min">{{ formatSize(data.builds.umd.minified, 2) }}</td>
            <td class="size-num size-strong">{{ formatSize(data.builds.umd.gzip, 2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-else-if="available && props.part === 'budgets' && data.budgets.length" class="size">
    <div class="size-scroll">
      <table class="size-table">
        <thead>
          <tr>
            <th scope="col">Check</th>
            <th scope="col" class="size-num">Limit</th>
            <th scope="col" class="size-num">Measured</th>
            <th scope="col" class="size-num size-min">Headroom</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in data.budgets" :key="b.name">
            <th scope="row">{{ b.name }}</th>
            <td class="size-num">{{ formatSize(b.limit, 2) }}</td>
            <td class="size-num size-strong">{{ formatSize(b.size, 2) }}</td>
            <td class="size-num size-min">
              {{ b.size > b.limit ? `Over by ${b.size - b.limit} B` : `${b.limit - b.size} B` }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-else-if="available && props.part === 'table'" class="size">
    <label class="size-search">
      <DocIcon name="search" :size="16" />
      <span class="visually-hidden">Search the exports</span>
      <input
        v-model="query"
        type="search"
        placeholder="Search by export, such as Card or useConfirm"
        autocomplete="off"
        spellcheck="false"
      />
    </label>
    <p class="size-meta">
      {{ shown }} of {{ data.exports.length }} exports. Minified and gzipped, without Vue and
      <code>@stripe/stripe-js</code>. {{ measured }}
    </p>

    <section v-for="g in groups" :key="g.id" class="size-group">
      <h3 :id="`exports-${g.id}`">
        {{ g.title }}
        <a class="header-anchor" :href="`#exports-${g.id}`" :aria-label="`Permalink to ${g.title}`"
          >&#8203;</a
        >
      </h3>
      <div class="size-scroll">
        <table class="size-table size-table--exports">
          <thead>
            <tr>
              <th scope="col">Export</th>
              <th scope="col" class="size-num size-min">Minified</th>
              <th scope="col" class="size-num">Gzipped</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in g.exports" :key="e.name">
              <th scope="row">
                <a v-if="e.link" :href="withBase(e.link)"
                  ><code
                    ><template v-for="(word, i) in words(e.name)" :key="i"
                      ><wbr v-if="i" />{{ word }}</template
                    ></code
                  ></a
                >
                <code v-else
                  ><template v-for="(word, i) in words(e.name)" :key="i"
                    ><wbr v-if="i" />{{ word }}</template
                  ></code
                >
                <span v-if="e.aliasOf" class="size-row-note">
                  Another name for <code>{{ e.aliasOf }}</code>
                </span>
                <span v-else-if="e.added !== undefined" class="size-row-note">
                  Adds {{ formatSize(e.added) }} after another element
                </span>
              </th>
              <td class="size-num size-min">{{ formatSize(e.minified, 2) }}</td>
              <td class="size-num size-strong">{{ formatSize(e.gzip, 2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p v-if="shown === 0" class="size-empty">
      No export matches <strong>{{ query }}</strong
      >. Try <code>Element</code>, <code>use</code> or <code>Checkout</code>.
    </p>
  </div>
</template>

<style scoped>
.size {
  margin: 20px 0 24px;
}

.size p {
  margin: 0;
  line-height: 1.5;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.size-meta {
  margin-top: 12px !important;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

/* Summary figures, in the cards /usage uses */
.size-figures {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin: 0 !important;
  padding: 0 !important;
  list-style: none;
}

.size-figure {
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

.size-figure-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.35 !important;
}

.size-figure-label :deep(.doc-icon) {
  flex: none;
  color: var(--vp-c-brand-1);
}

.size-figure-value {
  color: var(--vp-c-text-1);
  font-size: clamp(24px, 6vw, 30px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.15 !important;
}

/* Bars: a share of the whole library */
.size-share {
  margin-top: 16px;
}

.size-share p {
  margin-top: 8px !important;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.size-bar {
  display: block;
  height: 8px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}

.size-bar--row {
  width: 100%;
  min-width: 72px;
  height: 6px;
  margin-top: 8px;
}

.size-bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--vp-c-brand-1);
}

/* Tables: VitePress's table look, full width, scrolling sideways on a narrow screen */
.size-scroll {
  overflow-x: auto;
}

.size-table {
  display: table !important;
  width: 100%;
  margin: 0 !important;
}

.size-table th[scope='row'] {
  font-weight: 500;
  text-align: left;
}

.size-num {
  text-align: right !important;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.size-strong {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.size-row-share,
.size-row-note {
  display: block;
  margin-top: 4px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
}

.size-imports {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.size-imports code {
  font-size: 12px;
  font-weight: 400;
}

/* First element against the ones after it */
.size-elements {
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.size-element-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 16px;
  align-items: center;
}

.size-element-row + .size-element-row {
  margin-top: 16px;
}

.size-element-label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
}

.size-element-label span {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.size-element-value {
  grid-row: 1;
  grid-column: 2;
  color: var(--vp-c-text-1);
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.size-stack {
  grid-column: 1 / -1;
  display: flex;
  height: 12px;
  border-radius: 6px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}

.size-stack-shared {
  background: var(--vp-c-brand-soft);
  box-shadow: inset 0 0 0 1px var(--vp-c-brand-1);
  border-radius: 6px 0 0 6px;
}

.size-stack-own {
  min-width: 3px;
  background: var(--vp-c-brand-1);
}

.size-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 16px 0 0 !important;
  padding: 0 !important;
  list-style: none;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.size-legend li {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin: 0 !important;
}

.size-swatch {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.size-swatch--shared {
  background: var(--vp-c-brand-soft);
  box-shadow: inset 0 0 0 1px var(--vp-c-brand-1);
}

.size-swatch--own {
  background: var(--vp-c-brand-1);
}

/* Every export */
.size-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  transition: border-color 0.15s;
}

.size-search:focus-within {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.size-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 15px;
  outline: none;
}

.size-group h3 {
  margin-top: 28px;
}

.size-group .size-scroll {
  margin-top: 12px;
}

.size-table--exports .size-num {
  width: 7em;
}

.size-table--exports th[scope='row'] a {
  text-decoration: none;
}

.size-empty {
  margin-top: 16px !important;
  color: var(--vp-c-text-2);
}

/* Fallback when the library was not built */
.size-unavailable {
  display: flex;
  gap: 14px;
  padding: 20px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.size-unavailable > :deep(.doc-icon) {
  flex: none;
  margin-top: 2px;
  color: var(--vp-c-text-2);
}

.size-unavailable-title {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.size-unavailable p + p {
  margin-top: 6px;
  color: var(--vp-c-text-2);
}

/* Narrow screens: the gzipped size is the one that counts; long names wrap */
@media (max-width: 639px) {
  .size-figures {
    grid-template-columns: minmax(0, 1fr);
  }

  .size-figure {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
  }

  .size-min {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .size-search {
    transition: none;
  }
}
</style>
