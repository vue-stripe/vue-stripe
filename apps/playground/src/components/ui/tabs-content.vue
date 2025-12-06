<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { TabsContent } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const contentClass = computed(() =>
  cn(
    'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    props.class
  )
)
</script>

<template>
  <TabsContent :value="props.value" :class="contentClass">
    <slot />
  </TabsContent>
</template>
