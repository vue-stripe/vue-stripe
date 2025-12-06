<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const footerClass = computed(() =>
  cn('flex items-center p-6 pt-0', props.class)
)
</script>

<template>
  <div :class="footerClass">
    <slot />
  </div>
</template>
