<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { DialogDescription } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const descClass = computed(() =>
  cn('text-sm text-muted-foreground', props.class)
)
</script>

<template>
  <DialogDescription :class="descClass">
    <slot />
  </DialogDescription>
</template>
