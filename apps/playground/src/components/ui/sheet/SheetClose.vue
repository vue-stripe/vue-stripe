<script setup lang="ts">
import type { DialogCloseProps } from 'reka-ui'
import { DialogClose } from 'reka-ui'
import { forwardable } from '@/lib/utils'

const props = defineProps<DialogCloseProps>()
const forwarded = forwardable(props)
</script>

<template>
  <DialogClose v-bind="forwarded">
    <slot />
  </DialogClose>
</template>
