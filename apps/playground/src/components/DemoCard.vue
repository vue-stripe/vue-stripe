<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  title?: string
  description?: string
  variant?: 'default' | 'learning' | 'warning' | 'dark'
}>()

const cardClasses = computed(() => {
  const base = 'rounded-xl p-6 shadow-lg'

  const variants = {
    default: 'bg-card text-card-foreground',
    learning: 'bg-gradient-to-br from-info/10 to-info/5 border-l-4 border-info',
    warning: 'bg-warning/10 border-l-4 border-warning',
    dark: 'bg-slate-900 text-slate-100',
  }

  return cn(base, variants[props.variant || 'default'])
})

const titleClasses = computed(() => {
  const variants = {
    default: 'text-foreground',
    learning: 'text-info',
    warning: 'text-warning-foreground',
    dark: 'text-slate-100',
  }
  return cn('text-xl font-semibold', variants[props.variant || 'default'])
})

const descriptionClasses = computed(() => {
  const variants = {
    default: 'text-muted-foreground',
    learning: 'text-muted-foreground',
    warning: 'text-muted-foreground',
    dark: 'text-slate-400',
  }
  return cn('text-sm leading-relaxed', variants[props.variant || 'default'])
})
</script>

<template>
  <div :class="cardClasses">
    <header v-if="title || $slots.header" class="mb-5">
      <slot name="header">
        <h2 v-if="title" :class="titleClasses" class="mb-2">{{ title }}</h2>
        <p v-if="description" :class="descriptionClasses">{{ description }}</p>
      </slot>
    </header>
    <slot />
  </div>
</template>
