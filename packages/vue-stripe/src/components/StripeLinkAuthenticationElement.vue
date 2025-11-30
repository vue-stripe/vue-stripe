<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watch } from 'vue-demi'
import type {
  StripeLinkAuthenticationElement,
  StripeLinkAuthenticationElementOptions,
  StripeLinkAuthenticationElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { StripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeLinkAuthenticationElementOptions
}

interface Emits {
  (e: 'ready', element: StripeLinkAuthenticationElement): void
  (e: 'change', event: StripeLinkAuthenticationElementChangeEvent): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const elementsContext = inject(stripeElementsInjectionKey)

if (!elementsContext) {
  throw new StripeElementsError(
    'StripeLinkAuthenticationElement must be used within StripeElements'
  )
}

const elementRef = ref<HTMLElement>()
const element = ref<StripeLinkAuthenticationElement | null>(null)

const createElement = () => {
  if (!elementsContext.elements?.value || !elementRef.value) {
    return
  }

  try {
    // Create the link authentication element
    element.value = elementsContext.elements?.value.create('linkAuthentication', props.options)

    // Mount the element
    element.value.mount(elementRef.value)

    // Set up event listeners
    element.value.on('ready', () => {
      if (element.value) {
        emit('ready', element.value)
      }
    })

    element.value.on('change', (event) => {
      emit('change', event)
    })

  } catch (err) {
    console.error('[Vue Stripe] Link authentication element creation error:', err)
  }
}

const destroyElement = () => {
  if (element.value) {
    element.value.unmount()
    element.value.destroy()
    element.value = null
  }
}

// Watch for elements to become available
watch(
  () => elementsContext.elements?.value,
  (newElements) => {
    if (newElements && elementRef.value && !element.value) {
      createElement()
    }
  },
  { immediate: true }
)

// Watch for options changes - use type assertion since update may not be in types
watch(
  () => props.options,
  (newOptions) => {
     
    if (element.value && newOptions && typeof (element.value as any).update === 'function') {
       
      (element.value as any).update(newOptions)
    }
  },
  { deep: true }
)

onMounted(() => {
  if (elementsContext.elements?.value && elementRef.value) {
    createElement()
  }
})

onUnmounted(() => {
  destroyElement()
})

// Expose element for parent component access
defineExpose({
  element: element,
  focus: () => element.value?.focus(),
  blur: () => element.value?.blur(),
  clear: () => element.value?.clear()
})
</script>

<template>
  <div
    ref="elementRef"
    class="vue-stripe-link-auth-element"
  />
</template>

<style scoped>
.vue-stripe-link-auth-element {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
}

.vue-stripe-link-auth-element:focus-within {
  border-color: #635bff;
  box-shadow: 0 0 0 1px #635bff;
}
</style>
