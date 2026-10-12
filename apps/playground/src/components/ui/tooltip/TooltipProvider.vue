<script setup lang="ts">
import type { TooltipProviderProps } from 'reka-ui'
import { TooltipProvider } from 'reka-ui'
import { forwardable } from '@/lib/utils'

const props = defineProps<TooltipProviderProps>()
const forwarded = forwardable(props)
</script>

<template>
  <TooltipProvider v-bind="forwarded">
    <slot />
  </TooltipProvider>
</template>
