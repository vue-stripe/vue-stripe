<script lang="ts">
import {
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose
} from 'reka-ui'

export {
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription
}
</script>

<script setup lang="ts">
import { DialogRoot as Dialog } from 'reka-ui'
import { forwardable } from '@/lib/utils'

// Runtime declaration so `open` defaults to `undefined` (uncontrolled) instead of
// Vue's implicit Boolean `false`; type-based withDefaults cannot express that default.
const props = defineProps({
  open: { type: Boolean, default: undefined }
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <Dialog v-bind="forwardable({ open: props.open })" @update:open="emit('update:open', $event)">
    <slot />
  </Dialog>
</template>
