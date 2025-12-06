<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const descClass = computed(() =>
  cn('text-sm [&_p]:leading-relaxed', props.class)
)
</script>

<template>
  <div :class="descClass">
    <slot />
  </div>
</template>
