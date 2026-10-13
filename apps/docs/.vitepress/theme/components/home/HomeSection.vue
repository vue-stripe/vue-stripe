<script setup lang="ts">
// A titled home-page section whose body is markdown from index.md (code fences, live demos).
defineProps<{ title: string; lede?: string | undefined; id?: string | undefined }>()
</script>

<template>
  <section class="home-section" :aria-labelledby="id">
    <h2 :id="id" class="home-section-title">{{ title }}</h2>
    <p v-if="lede" class="home-section-lede">{{ lede }}</p>
    <div class="home-section-body vp-doc">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.home-section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 96px 24px 0;
}

@media (min-width: 960px) {
  .home-section {
    padding: 112px 32px 0;
  }
}

.home-section:last-child {
  padding-bottom: 96px;
}

.home-section-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--vp-c-text-1);
}

.home-section-lede {
  max-width: 60ch;
  margin: 8px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.home-section-body {
  margin-top: 24px;
}

.home-section-body :deep(div[class*='language-']:first-child) {
  margin-top: 0;
}
</style>
