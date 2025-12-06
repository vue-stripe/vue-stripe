<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const headerClass = computed(() =>
  cn('[&_tr]:border-b', props.class)
)
</script>

<template>
  <thead :class="headerClass">
    <slot />
  </thead>
</template>
