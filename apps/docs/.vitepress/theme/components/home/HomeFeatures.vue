<script setup lang="ts">
import { withBase } from 'vitepress'
import DocIcon from '../DocIcon.vue'
import { FEATURES } from '../../data/home'
</script>

<template>
  <section class="features" aria-label="Features">
    <div class="features-grid">
      <component
        :is="f.link ? 'a' : 'div'"
        v-for="f in FEATURES"
        :key="f.title"
        :href="f.link ? withBase(f.link) : undefined"
        :class="['feature', { 'is-link': f.link }]"
      >
        <span class="feature-icon"><DocIcon :name="f.icon" :size="20" /></span>
        <h2 class="feature-title">{{ f.title }}</h2>
        <p class="feature-text">{{ f.text }}</p>
      </component>
    </div>
  </section>
</template>

<style scoped>
.features {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 960px) {
  .features {
    padding: 0 32px;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 16px;
}

.feature {
  display: block;
  padding: 24px;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s;
}

.feature.is-link:hover {
  border-color: var(--vp-c-brand-1);
}

.feature.is-link:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.feature-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--vp-c-text-1);
}

.feature-text {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 22px;
  color: var(--vp-c-text-2);
}

@media (prefers-reduced-motion: reduce) {
  .feature {
    transition: none;
  }
}
</style>
