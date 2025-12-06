<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { Label as LabelPrimitive } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  for?: string
}

const props = defineProps<Props>()

const labelClass = computed(() =>
  cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    props.class
  )
)
</script>

<template>
  <LabelPrimitive :class="labelClass" :for="props.for">
    <slot />
  </LabelPrimitive>
</template>
