<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { DialogTitle } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const titleClass = computed(() =>
  cn('text-lg font-semibold leading-none tracking-tight', props.class)
)
</script>

<template>
  <DialogTitle :class="titleClass">
    <slot />
  </DialogTitle>
</template>
