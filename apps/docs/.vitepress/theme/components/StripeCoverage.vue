<script setup lang="ts">
import { computed } from 'vue'
import { coverage, type CoverageStatus } from '../data/stripe-coverage'

const all = computed(() => coverage.flatMap((c) => c.items))

const count = (s: CoverageStatus) => all.value.filter((i) => i.status === s).length

const stats = computed(() => {
  const covered = count('covered')
  const accessible = count('accessible')
  const planned = count('planned')
  const deprecated = count('deprecated')
  const total = covered + accessible + planned // exclude deprecated from the denominator
  return {
    covered,
    accessible,
    planned,
    deprecated,
    total,
    coveredPct: total ? Math.round((covered / total) * 100) : 0,
    reachablePct: total ? Math.round(((covered + accessible) / total) * 100) : 0
  }
})

const META: Record<CoverageStatus, { label: string; icon: string; cls: string }> = {
  covered: { label: 'Covered', icon: '✓', cls: 'is-covered' },
  accessible: { label: 'Via raw API', icon: '◐', cls: 'is-accessible' },
  planned: { label: 'Planned', icon: '○', cls: 'is-planned' },
  deprecated: { label: 'Deprecated', icon: '—', cls: 'is-deprecated' }
}

const issueUrl = (n?: number) =>
  n ? `https://github.com/vue-stripe/vue-stripe/issues/${n}` : undefined
</script>

<template>
  <div class="coverage">
    <div class="coverage-summary">
      <div class="coverage-headline">
        <span class="coverage-fraction">{{ stats.covered }}<span class="coverage-of">/{{ stats.total }}</span></span>
        <span class="coverage-caption">Stripe.js elements &amp; features wrapped in dedicated Vue components</span>
      </div>

      <div class="coverage-bar" role="img" :aria-label="`${stats.coveredPct}% covered, ${stats.reachablePct}% reachable`">
        <div class="coverage-bar-fill is-covered" :style="{ width: stats.coveredPct + '%' }" />
        <div
          class="coverage-bar-fill is-accessible"
          :style="{ width: (stats.reachablePct - stats.coveredPct) + '%' }"
        />
      </div>

      <div class="coverage-legend">
        <span class="coverage-chip is-covered">{{ META.covered.icon }} {{ stats.covered }} Covered</span>
        <span class="coverage-chip is-accessible">{{ META.accessible.icon }} {{ stats.accessible }} Via raw API</span>
        <span class="coverage-chip is-planned">{{ META.planned.icon }} {{ stats.planned }} Planned</span>
        <span class="coverage-chip is-deprecated">{{ META.deprecated.icon }} {{ stats.deprecated }} Deprecated</span>
      </div>

      <p class="coverage-note">
        <strong>{{ stats.coveredPct }}%</strong> have a dedicated wrapper, and
        <strong>{{ stats.reachablePct }}%</strong> are reachable today — anything not wrapped is still
        available through the raw <code>stripe</code> / <code>elements</code> instance from
        <code>useStripe()</code>.
      </p>
    </div>

    <div class="coverage-groups">
      <section v-for="cat in coverage" :key="cat.group" class="coverage-group">
        <h4 class="coverage-group-title">{{ cat.group }}</h4>
        <ul class="coverage-items">
          <li v-for="item in cat.items" :key="item.name" :class="['coverage-item', META[item.status].cls]">
            <span class="coverage-item-icon">{{ META[item.status].icon }}</span>
            <span class="coverage-item-name">
              <component
                :is="issueUrl(item.issue) ? 'a' : 'span'"
                :href="issueUrl(item.issue)"
                :target="item.issue ? '_blank' : undefined"
                rel="noopener noreferrer"
              >{{ item.name }}</component>
            </span>
            <code class="coverage-item-api">{{ item.api }}</code>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.coverage {
  margin: 24px 0;
}

.coverage-summary {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 24px;
  background: var(--vp-c-bg-soft);
}

.coverage-headline {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 14px;
  margin-bottom: 16px;
}

.coverage-fraction {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  color: var(--vp-c-brand-1);
}

.coverage-of {
  color: var(--vp-c-text-3);
  font-weight: 600;
}

.coverage-caption {
  color: var(--vp-c-text-2);
  font-size: 14px;
  max-width: 460px;
}

.coverage-bar {
  display: flex;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--vp-c-default-soft);
}

.coverage-bar-fill {
  height: 100%;
  transition: width 0.4s ease;
}

.coverage-bar-fill.is-covered {
  background: var(--vp-c-brand-1);
}

.coverage-bar-fill.is-accessible {
  background: var(--vp-c-brand-soft);
}

.coverage-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.coverage-chip {
  font-size: 12.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.coverage-chip.is-covered {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.coverage-chip.is-planned {
  color: #b7791f;
}

.coverage-note {
  margin: 14px 0 0;
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.coverage-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.coverage-group-title {
  margin: 0 0 8px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
  border: none;
}

.coverage-items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.coverage-item {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13.5px;
}

.coverage-item-icon {
  text-align: center;
  font-weight: 700;
  color: var(--vp-c-text-3);
}

.coverage-item.is-covered .coverage-item-icon {
  color: var(--vp-c-brand-1);
}

.coverage-item.is-planned .coverage-item-icon {
  color: #b7791f;
}

.coverage-item.is-deprecated {
  opacity: 0.55;
}

.coverage-item-name {
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coverage-item.is-deprecated .coverage-item-name {
  text-decoration: line-through;
}

.coverage-item-name a {
  color: inherit;
  text-decoration: underline dotted;
}

.coverage-item-api {
  font-size: 11px;
  color: var(--vp-c-text-3);
  background: transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}
</style>
