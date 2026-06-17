<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watch } from 'vue-demi'
import type {
  StripeLinkAuthenticationElement,
  StripeLinkAuthenticationElementOptions,
  StripeLinkAuthenticationElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeLinkAuthenticationElementOptions
}

interface Emits {
  (e: 'ready', element: StripeLinkAuthenticationElement): void
  (e: 'change', event: StripeLinkAuthenticationElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const elementsContext = inject(stripeElementsInjectionKey)

if (!elementsContext) {
  throw new VueStripeElementsError(
    'VueStripeLinkAuthenticationElement must be used within VueStripeElements'
  )
}

const elementRef = ref<HTMLElement>()
const element = ref<StripeLinkAuthenticationElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Named handlers so listeners can be removed on teardown.
const handleReady = () => {
  loading.value = false
  if (element.value) {
    emit('ready', element.value)
  }
}
const handleChange = (event: StripeLinkAuthenticationElementChangeEvent) => {
  emit('change', event)
}
const handleFocus = () => emit('focus')
const handleBlur = () => emit('blur')
const handleEscape = () => emit('escape')

const createElement = () => {
  if (!elementsContext.elements?.value || !elementRef.value) {
    return
  }

  try {
    error.value = null
    loading.value = true

    // Create the link authentication element
    element.value = elementsContext.elements.value.create('linkAuthentication', props.options)

    // Mount the element
    element.value.mount(elementRef.value)

    // Set up event listeners
    element.value.on('ready', handleReady)
    element.value.on('change', handleChange)
    element.value.on('focus', handleFocus)
    element.value.on('blur', handleBlur)
    element.value.on('escape', handleEscape)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create link authentication element'
    error.value = message
    loading.value = false
    console.error('[Vue Stripe] Link authentication element creation error:', message)
  }
}

const destroyElement = () => {
  if (!element.value) return

  element.value.off('ready', handleReady)
  element.value.off('change', handleChange)
  element.value.off('focus', handleFocus)
  element.value.off('blur', handleBlur)
  element.value.off('escape', handleEscape)

  element.value.unmount()
  element.value.destroy()
  element.value = null
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

// Expose element, state and methods for parent component access
defineExpose({
  element,
  loading,
  error,
  focus: () => element.value?.focus(),
  blur: () => element.value?.blur(),
  clear: () => element.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-link-auth">
    <div
      v-if="error"
      class="vue-stripe-link-auth-error"
    >
      <slot
        name="error"
        :error="error"
      >
        <div class="vue-stripe-error-message">
          {{ error }}
        </div>
      </slot>
    </div>
    <div
      ref="elementRef"
      class="vue-stripe-link-auth-element"
    />
    <div
      v-if="loading"
      class="vue-stripe-link-auth-loading"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading…
        </div>
      </slot>
    </div>
  </div>
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

.vue-stripe-link-auth-error {
  color: #dc3545;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
  font-size: 0.875rem;
}

.vue-stripe-link-auth-loading {
  color: #6c757d;
  padding: 0.5rem 0;
  text-align: center;
}

.vue-stripe-error-message,
.vue-stripe-loading-message {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
