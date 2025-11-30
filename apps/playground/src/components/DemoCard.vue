<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  variant?: 'default' | 'learning' | 'warning' | 'dark'
}>()
</script>

<template>
  <div :class="['demo-card', variant && `demo-card--${variant}`]">
    <header v-if="title || $slots.header" class="demo-card-header">
      <slot name="header">
        <h2 v-if="title" class="demo-card-title">{{ title }}</h2>
        <p v-if="description" class="demo-card-description">{{ description }}</p>
      </slot>
    </header>
    <slot />
  </div>
</template>

<style scoped>
.demo-card {
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
}

.demo-card-header {
  margin-bottom: var(--space-5);
}

.demo-card-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
}

.demo-card-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

/* Learning variant */
.demo-card--learning {
  background: linear-gradient(135deg, var(--color-info-light) 0%, #f0f7fa 100%);
  border-left: 4px solid var(--color-info);
}

.demo-card--learning .demo-card-title {
  color: var(--color-info);
}

/* Warning variant */
.demo-card--warning {
  background: var(--color-warning-light);
  border-left: 4px solid var(--color-warning);
}

/* Dark variant */
.demo-card--dark {
  background: var(--color-bg-dark);
  color: #f8f9fa;
}

.demo-card--dark .demo-card-title {
  color: #f8f9fa;
}

.demo-card--dark .demo-card-description {
  color: #aaa;
}
</style>
