<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsList } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const listClass = computed(() =>
  cn(
    'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
    props.class
  )
)
</script>

<template>
  <TabsList :class="listClass">
    <slot />
  </TabsList>
</template>
