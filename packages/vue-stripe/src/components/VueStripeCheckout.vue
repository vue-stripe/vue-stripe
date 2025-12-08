<script setup lang="ts">
import { ref, useSlots, computed } from 'vue-demi'
import { useStripe } from '../composables/useStripe'
import { VueStripeProviderError } from '../utils/errors'

interface Props {
  /**
   * Checkout Session ID (starts with cs_).
   * When provided, redirects to the session's checkout page.
   */
  sessionId?: string
  /**
   * Checkout Session URL from Stripe API.
   * For @stripe/stripe-js v8.x compatibility where redirectToCheckout is removed.
   * When provided, this takes precedence over sessionId.
   */
  sessionUrl?: string
  /**
   * Price ID for client-side session creation (legacy, requires redirectToCheckout).
   * @deprecated Use sessionUrl with server-side session creation for v8.x compatibility.
   */
  priceId?: string
  mode?: 'payment' | 'subscription'
  successUrl?: string
  cancelUrl?: string
  customerEmail?: string
  clientReferenceId?: string
  submitType?: 'auto' | 'book' | 'donate' | 'pay'
  buttonText?: string
  loadingText?: string
  disabled?: boolean
  buttonClass?: string
}

interface Emits {
  (e: 'checkout'): void
  (e: 'success'): void
  (e: 'error', error: Error): void
  (e: 'before-redirect', data: { url: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'payment',
  buttonText: 'Checkout',
  loadingText: 'Redirecting...',
  disabled: false,
  buttonClass: 'vue-stripe-checkout-button'
})

const emit = defineEmits<Emits>()

const { stripe } = useStripe()
const loading = ref(false)
const slots = useSlots()

// Check if user provided custom default slot content
const hasCustomSlot = computed(() => !!slots['default'])

/**
 * Check if redirectToCheckout is available (stripe-js v7.x)
 */
const hasRedirectToCheckout = (): boolean => {
  return stripe.value !== null &&
    typeof (stripe.value as any).redirectToCheckout === 'function'
}

/**
 * Handle checkout - supports both v7.x (redirectToCheckout) and v8.x (URL redirect)
 */
const handleSubmit = async () => {
  loading.value = true
  emit('checkout')

  try {
    // Option 1: Direct URL redirect (v8.x compatible, recommended)
    if (props.sessionUrl) {
      emit('before-redirect', { url: props.sessionUrl })
      window.location.replace(props.sessionUrl)
      emit('success')
      return
    }

    // Option 2: Session-based checkout with redirectToCheckout (v7.x)
    if (props.sessionId) {
      // Check if redirectToCheckout is available
      if (!hasRedirectToCheckout()) {
        throw new VueStripeProviderError(
          'redirectToCheckout is not available. This method was removed in @stripe/stripe-js v8.x. ' +
          'Use sessionUrl prop with the checkout session URL instead.'
        )
      }

      if (!stripe.value) {
        throw new VueStripeProviderError('Stripe not initialized')
      }

      const result = await (stripe.value as any).redirectToCheckout({
        sessionId: props.sessionId
      })

      if (result.error) {
        throw new VueStripeProviderError(result.error.message || 'Redirect to checkout failed')
      }

      emit('success')
      return
    }

    // Option 3: Price-based checkout (v7.x only, deprecated)
    if (props.priceId) {
      if (!hasRedirectToCheckout()) {
        throw new VueStripeProviderError(
          'Price-based checkout using redirectToCheckout is not available in @stripe/stripe-js v8.x. ' +
          'Create a Checkout Session on your server and use sessionUrl prop instead.'
        )
      }

      if (!stripe.value) {
        throw new VueStripeProviderError('Stripe not initialized')
      }

      console.warn(
        '[Vue Stripe] Price-based checkout is deprecated in v8.x. ' +
        'Create a Checkout Session on your server and use sessionUrl prop instead.'
      )

      const result = await (stripe.value as any).redirectToCheckout({
        lineItems: [
          {
            price: props.priceId,
            quantity: 1
          }
        ],
        mode: props.mode,
        successUrl: props.successUrl || window.location.origin + '/success',
        cancelUrl: props.cancelUrl || window.location.origin + '/cancel',
        customerEmail: props.customerEmail,
        clientReferenceId: props.clientReferenceId,
        submitType: props.submitType
      })

      if (result.error) {
        throw new VueStripeProviderError(result.error.message || 'Redirect to checkout failed')
      }

      emit('success')
      return
    }

    // No valid checkout option provided
    throw new VueStripeProviderError(
      'Either sessionUrl, sessionId, or priceId is required. ' +
      'For @stripe/stripe-js v8.x, use sessionUrl.'
    )
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Checkout failed')
    emit('error', error)
    console.error('[Vue Stripe] Checkout error:', error)
  } finally {
    loading.value = false
  }
}

// Expose checkout method for custom button implementations
defineExpose({ checkout: handleSubmit, loading })
</script>

<template>
  <!-- Custom slot: wrap with click handler so user doesn't need scoped slot syntax -->
  <span
    v-if="hasCustomSlot"
    @click="handleSubmit"
    class="vue-stripe-checkout-wrapper"
  >
    <slot
      :checkout="handleSubmit"
      :loading="loading"
      :disabled="disabled"
    />
  </span>

  <!-- Default button when no slot content provided -->
  <button
    v-else
    :disabled="loading || disabled"
    :class="buttonClass"
    @click="handleSubmit"
  >
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>