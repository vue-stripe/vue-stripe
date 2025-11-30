<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch } from 'vue-demi'
import type {
  StripeCardElement as StripeCardElementType,
  StripeCardElementOptions,
  StripeCardElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { VueStripeElementsError } from '../utils/errors'

interface Props {
  options?: StripeCardElementOptions
}

interface Emits {
  (e: 'ready', element: StripeCardElementType): void
  (e: 'change', event: StripeCardElementChangeEvent): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'escape'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elementRef = ref<HTMLDivElement>()
const cardElement = ref<StripeCardElementType | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const elementsInstance = inject(stripeElementsInjectionKey)

if (!elementsInstance) {
  throw new VueStripeElementsError(
    'VueStripeCardElement must be used within VueStripeElements'
  )
}

const createCardElement = () => {
  if (!elementsInstance.elements.value) {
    error.value = 'Elements instance not available'
    loading.value = false
    return
  }

  if (!elementRef.value) {
    error.value = 'Mount point not available'
    loading.value = false
    return
  }

  try {
    error.value = null
    loading.value = true

    // Create card element
    cardElement.value = elementsInstance.elements.value.create('card', props.options)

    // Set up event listeners
    cardElement.value.on('ready', () => {
      loading.value = false
      emit('ready', cardElement.value!)
    })

    cardElement.value.on('change', (event) => {
      // Update error state from Stripe
      if (event.error) {
        error.value = event.error.message
      } else {
        error.value = null
      }
      emit('change', event)
    })

    cardElement.value.on('focus', () => {
      emit('focus')
    })

    cardElement.value.on('blur', () => {
      emit('blur')
    })

    cardElement.value.on('escape', () => {
      emit('escape')
    })

    // Mount the element
    cardElement.value.mount(elementRef.value)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create card element'
    error.value = errorMessage
    loading.value = false
    console.error('[Vue Stripe] Card element creation error:', errorMessage)
  }
}

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (cardElement.value && newOptions) {
      cardElement.value.update(newOptions)
    }
  },
  { deep: true }
)

// Watch for elements instance to become available
watch(
  () => elementsInstance.elements.value,
  (newElements) => {
    if (newElements && elementRef.value && !cardElement.value) {
      createCardElement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (elementsInstance.elements.value && elementRef.value && !cardElement.value) {
    createCardElement()
  }
})

onUnmounted(() => {
  if (cardElement.value) {
    cardElement.value.destroy()
  }
})

// Expose element and methods for parent access
defineExpose({
  element: cardElement,
  loading,
  error,
  focus: () => cardElement.value?.focus(),
  blur: () => cardElement.value?.blur(),
  clear: () => cardElement.value?.clear()
})
</script>

<template>
  <div class="vue-stripe-card-element">
    <div
      v-if="error"
      class="vue-stripe-card-element-error"
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
      class="vue-stripe-card-element-mount"
      :class="{ 'vue-stripe-card-element-loading': loading }"
    />
    <div
      v-if="loading"
      class="vue-stripe-card-element-loader"
    >
      <slot name="loading">
        <div class="vue-stripe-loading-message">
          Loading card form...
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.vue-stripe-card-element {
  position: relative;
}

.vue-stripe-card-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-card-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-card-element-loading {
  opacity: 0.5;
}

.vue-stripe-card-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-card-element-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #6c757d;
  text-align: center;
}

.vue-stripe-error-message,
.vue-stripe-loading-message {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>