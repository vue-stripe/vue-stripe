import { defineComponent, ref, type PropType } from 'vue-demi'
import { VueStripeCheckoutError } from '../utils/errors'
import { hx } from '../utils/h'

/**
 * Redirects to a hosted Checkout Session URL created on your server.
 * Stripe.js removed `redirectToCheckout` (sessionId / priceId) in Clover; no
 * `<VueStripeProvider>` is needed.
 */
export default defineComponent({
  name: 'VueStripeCheckout',
  props: {
    /** Hosted Checkout Session URL (`session.url`) created on your server. */
    sessionUrl: { type: String as PropType<string | undefined>, default: undefined },
    buttonText: { type: String, default: 'Checkout' },
    loadingText: { type: String, default: 'Redirecting...' },
    disabled: { type: Boolean, default: false },
    buttonClass: { type: String, default: 'vue-stripe-checkout-button' }
  },
  emits: ['checkout', 'before-redirect', 'success', 'error'],
  setup(props, { emit, expose, slots }) {
    const loading = ref(false)

    const checkout = () => {
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

    expose({ checkout, loading })

    return () => {
      // Custom content: the wrapper handles clicks, so a plain slot works without scoped props.
      const custom = slots['default']
      if (custom) {
        return hx(
          'span',
          { class: 'vue-stripe-checkout-wrapper', onClick: checkout },
          custom({ checkout, loading: loading.value, disabled: props.disabled })
        )
      }
      return hx(
        'button',
        { class: props.buttonClass, disabled: loading.value || props.disabled, onClick: checkout },
        loading.value
          ? [hx('span', { class: 'vue-stripe-loading-spinner' }), ` ${props.loadingText}`]
          : props.buttonText
      )
    }
  }
})
