<script setup lang="ts">
import { TabsRoot } from 'reka-ui'
import { forwardable } from '@/lib/utils'

interface Props {
  defaultValue?: string
  modelValue?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <TabsRoot
    v-bind="forwardable({ defaultValue: props.defaultValue, modelValue: props.modelValue })"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <slot />
  </TabsRoot>
</template>
