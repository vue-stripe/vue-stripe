<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const contentClass = computed(() =>
  cn('p-6 pt-0', props.class)
)
</script>

<template>
  <div :class="contentClass">
    <slot />
  </div>
</template>
