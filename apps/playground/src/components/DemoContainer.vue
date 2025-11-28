<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'dark' | 'error'
}>()
</script>

<template>
  <div :class="['demo-box', variant && `demo-box--${variant}`]">
    <slot />
  </div>
</template>

<style scoped>
.demo-box {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  min-height: 120px;
}

.demo-box--dark {
  background: var(--color-bg-dark);
  color: #f8f9fa;
}

.demo-box--error {
  background: #fff5f5;
  border: 1px solid #fecaca;
}
</style>
