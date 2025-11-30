<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="page-layout">
    <header v-if="title || $slots.header" class="page-header">
      <slot name="header">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="description" class="page-description">{{ description }}</p>
      </slot>
    </header>
    <slot />
  </div>
</template>

<style scoped>
.page-layout {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.page-header {
  margin-bottom: var(--space-2);
}

.page-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: white;
}

.page-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: var(--text-base);
  line-height: 1.6;
}
</style>
