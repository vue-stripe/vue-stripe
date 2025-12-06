<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  variant?: 'default' | 'dark' | 'error'
}>()

const containerClasses = computed(() => {
  const base = 'rounded-lg p-6 min-h-[120px]'

  const variants = {
    default: 'bg-secondary',
    dark: 'bg-slate-900 text-slate-100',
    error: 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900',
  }

  return cn(base, variants[props.variant || 'default'])
})
</script>

<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>
