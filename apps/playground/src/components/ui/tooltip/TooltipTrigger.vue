<script setup lang="ts">
import type { TooltipTriggerProps } from 'reka-ui'
import { TooltipTrigger } from 'reka-ui'
import { forwardable } from '@/lib/utils'

const props = defineProps<TooltipTriggerProps>()
const forwarded = forwardable(props)
</script>

<template>
  <TooltipTrigger v-bind="forwarded">
    <slot />
  </TooltipTrigger>
</template>
