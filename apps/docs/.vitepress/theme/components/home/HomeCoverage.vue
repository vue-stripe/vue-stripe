<script setup lang="ts">
import { withBase } from 'vitepress'
import { coverage } from '../../data/stripe-coverage'

const items = coverage.flatMap((c) => c.items)
const covered = items.filter((i) => i.status === 'covered').length
const supported = items.filter((i) => i.status !== 'deprecated').length
const percent = supported ? Math.floor((covered / supported) * 100) : 0
</script>

<template>
  <section class="home-coverage" aria-label="Stripe.js coverage">
    <div class="home-coverage-inner">
      <p>
        <strong>{{ covered }} of {{ supported }}</strong> Stripe.js 10 elements and methods have a
        Vue Stripe component or composable.
      </p>
      <div
        class="home-coverage-bar"
        role="progressbar"
        :aria-valuenow="percent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${percent}% of Stripe.js covered`"
      >
        <span :style="{ width: percent + '%' }" />
      </div>
      <a :href="withBase('/coverage')">See every feature and its docs</a>
    </div>
  </section>
</template>

<style scoped>
.home-coverage {
  max-width: 1152px;
  margin: 0 auto;
  padding: 96px 24px 96px;
}

@media (min-width: 960px) {
  .home-coverage {
    padding: 112px 32px 112px;
  }
}

.home-coverage-inner {
  padding: 28px 32px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.home-coverage p {
  margin: 0;
  max-width: 60ch;
  font-size: 18px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.home-coverage strong {
  color: var(--vp-c-text-1);
}

.home-coverage-bar {
  height: 6px;
  margin: 16px 0;
  border-radius: 3px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}

.home-coverage-bar span {
  display: block;
  height: 100%;
  background: var(--vp-c-brand-1);
}

.home-coverage a {
  color: var(--vp-c-brand-1);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
}

.home-coverage a:hover {
  text-decoration: underline;
}

.home-coverage a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
</style>
