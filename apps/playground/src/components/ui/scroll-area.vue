<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
} from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const scrollAreaClass = computed(() =>
  cn('relative overflow-hidden', props.class)
)
</script>

<template>
  <ScrollAreaRoot :class="scrollAreaClass">
    <ScrollAreaViewport class="h-full w-full rounded-[inherit]">
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      class="flex touch-none select-none transition-colors data-[orientation=vertical]:h-full data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:border-l data-[orientation=horizontal]:border-t border-transparent p-px"
      orientation="vertical"
    >
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar
      class="flex touch-none select-none transition-colors data-[orientation=vertical]:h-full data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:border-l data-[orientation=horizontal]:border-t border-transparent p-px"
      orientation="horizontal"
    >
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
