<script setup lang="ts">
import type { DialogTriggerProps } from 'reka-ui'
import { DialogTrigger } from 'reka-ui'
import { forwardable } from '@/lib/utils'

const props = defineProps<DialogTriggerProps>()
const forwarded = forwardable(props)
</script>

<template>
  <DialogTrigger v-bind="forwarded">
    <slot />
  </DialogTrigger>
</template>
