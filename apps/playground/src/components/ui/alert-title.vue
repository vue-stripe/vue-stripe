<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const titleClass = computed(() =>
  cn('mb-1 font-medium leading-none tracking-tight', props.class)
)
</script>

<template>
  <h5 :class="titleClass">
    <slot />
  </h5>
</template>
