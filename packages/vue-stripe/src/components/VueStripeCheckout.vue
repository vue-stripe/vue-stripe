<script setup lang="ts">
import { ref } from 'vue-demi'
import type { RedirectToCheckoutOptions } from '@stripe/stripe-js'
import { useStripe } from '../composables/useStripe'
import { VueStripeProviderError } from '../utils/errors'

interface Props {
  sessionId?: string
  priceId?: string
  mode?: 'payment' | 'subscription'
  successUrl?: string
  cancelUrl?: string
  customerEmail?: string
  clientReferenceId?: string
  submitType?: 'auto' | 'book' | 'donate' | 'pay'
  options?: Partial<RedirectToCheckoutOptions>
  buttonText?: string
  loadingText?: string
  disabled?: boolean
  buttonClass?: string
}

interface Emits {
  (e: 'click'): void
  (e: 'success'): void
  (e: 'error', error: Error): void
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

const redirectToCheckout = async () => {
  if (!stripe.value) {
    const error = new VueStripeProviderError('Stripe not initialized')
    emit('error', error)
    return
  }

  if (!props.sessionId && !props.priceId) {
    const error = new VueStripeProviderError('Either sessionId or priceId is required')
    emit('error', error)
    return
  }
  
  try {
    loading.value = true
    emit('click')

    let result: { error?: { message?: string } }

    if (props.sessionId) {
      // Session-based checkout
      result = await stripe.value.redirectToCheckout({
        sessionId: props.sessionId,
        ...props.options
      })
    } else {
      // Price-based checkout
      result = await stripe.value.redirectToCheckout({
        lineItems: [
          {
            price: props.priceId!,
            quantity: 1
          }
        ],
        mode: props.mode!,
        successUrl: props.successUrl || window.location.origin + '/success',
        cancelUrl: props.cancelUrl || window.location.origin + '/cancel',
        customerEmail: props.customerEmail,
        clientReferenceId: props.clientReferenceId,
        submitType: props.submitType
      } as RedirectToCheckoutOptions)
    }

    if (result.error) {
      throw new VueStripeProviderError(result.error.message || 'Redirect to checkout failed')
    }
    
    emit('success')
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Checkout failed')
    emit('error', error)
    console.error('[Vue Stripe] Checkout error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button 
    :disabled="loading || disabled"
    :class="buttonClass"
    @click="redirectToCheckout"
  >
    <slot v-if="!loading">
      {{ buttonText }}
    </slot>
    <slot
      v-else
      name="loading"
    >
      <span class="vue-stripe-loading-spinner" />
      {{ loadingText }}
    </slot>
  </button>
</template>

<style scoped>
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