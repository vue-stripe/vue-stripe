<script setup lang="ts">
import { ref, useSlots, computed } from 'vue-demi'
import { VueStripeCheckoutError } from '../utils/errors'

interface Props {
  /**
   * Hosted Checkout Session URL (`session.url`) created on your server.
   * Stripe.js removed `redirectToCheckout` (sessionId / priceId) in Clover.
   */
  sessionUrl?: string
  buttonText?: string
  loadingText?: string
  disabled?: boolean
  buttonClass?: string
}

interface Emits {
  (e: 'checkout'): void
  (e: 'before-redirect', data: { url: string }): void
  (e: 'success'): void
  (e: 'error', error: Error): void
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: 'Checkout',
  loadingText: 'Redirecting...',
  disabled: false,
  buttonClass: 'vue-stripe-checkout-button'
})

const emit = defineEmits<Emits>()

const loading = ref(false)
const slots = useSlots()

// Check if user provided custom default slot content
const hasCustomSlot = computed(() => !!slots['default'])

const handleSubmit = () => {
  if (loading.value || props.disabled) return
  emit('checkout')

  if (!props.sessionUrl) {
    const error = new VueStripeCheckoutError(
      'VueStripeCheckout: `sessionUrl` is required (create the Checkout Session on your server)'
    )
    console.error('[Vue Stripe] Checkout error:', error.message)
    emit('error', error)
    return
  }

  // The page navigates away; loading stays on until it does.
  loading.value = true
  emit('before-redirect', { url: props.sessionUrl })
  window.location.replace(props.sessionUrl)
  emit('success')
}

// Expose checkout method for custom button implementations
defineExpose({ checkout: handleSubmit, loading })
</script>

<template>
  <!-- Custom slot: wrap with click handler so user doesn't need scoped slot syntax -->
  <span v-if="hasCustomSlot" class="vue-stripe-checkout-wrapper" @click="handleSubmit">
    <slot :checkout="handleSubmit" :loading="loading" :disabled="disabled" />
  </span>

  <!-- Default button when no slot content provided -->
  <button v-else :disabled="loading || disabled" :class="buttonClass" @click="handleSubmit">
    <template v-if="!loading">
      {{ buttonText }}
    </template>
    <template v-else>
      <span class="vue-stripe-loading-spinner" />
      {{ loadingText }}
    </template>
  </button>
</template>

<style scoped>
.vue-stripe-checkout-wrapper {
  display: contents;
}

.vue-stripe-checkout-button {
  background-color: #635bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.vue-stripe-checkout-button:hover:not(:disabled) {
  background-color: #5a52e8;
}

.vue-stripe-checkout-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.vue-stripe-loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: vue-stripe-spin 1s linear infinite;
}

@keyframes vue-stripe-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
