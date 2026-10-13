import {
  defineComponent,
  getCurrentInstance,
  markRaw,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  type PropType
} from 'vue-demi'
import type { StripeEmbeddedCheckout, StripeEmbeddedCheckoutOptions } from '@stripe/stripe-js'
import { injectStripe } from '../utils/inject-stripe'
import { renderElement } from '../utils/element-render'

// Stripe.js allows one Embedded Checkout per page; this is the instance holding it.
let owner: object | null = null

/**
 * Stripe's prebuilt Checkout page embedded in your site
 * (`stripe.createEmbeddedCheckoutPage()`, `ui_mode: 'embedded_page'`).
 *
 * Mounts once Stripe has loaded and destroys the page on unmount. To switch to
 * another Checkout Session, re-mount the component (e.g. change its `key`).
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripeEmbeddedCheckout',
  props: {
    /** Client secret of a Checkout Session created with `ui_mode: 'embedded_page'`. */
    clientSecret: { type: String as PropType<string | undefined>, default: undefined },
    /** Alternative to `clientSecret`: a function resolving to the client secret. */
    fetchClientSecret: {
      type: Function as PropType<(() => Promise<string>) | undefined>,
      default: undefined
    },
    /**
     * Called when the customer changes line items; resolve `{ type: 'accept' }` or
     * `{ type: 'reject', errorMessage }`. Required when the session sets
     * `permissions.update.line_items: 'server_only'`.
     */
    onLineItemsChange: {
      type: Function as PropType<StripeEmbeddedCheckoutOptions['onLineItemsChange']>,
      default: undefined
    }
  },
  emits: ['ready', 'complete', 'analytics', 'error'],
  setup(props, { emit, expose, slots }) {
    const stripeInstance = injectStripe('VueStripeEmbeddedCheckout')

    // Stripe objects are never made deeply reactive.
    const checkout = shallowRef<StripeEmbeddedCheckout | null>(null)
    const loading = ref(true)
    const error = ref<string | null>(null)
    const instance = getCurrentInstance()
    const token = {}

    let started = false
    let mounted = false
    let unmounted = false

    // String template ref: resolves the same way on Vue 2 and Vue 3.
    const mountPoint = () =>
      (instance?.proxy as { $refs: Record<string, HTMLElement | undefined> } | null)?.$refs[
        'mount'
      ] ?? null

    const release = () => {
      if (owner === token) owner = null
    }

    const fail = (message: string) => {
      error.value = message
      loading.value = false
      console.error('[Vue Stripe] Embedded Checkout error:', message)
      emit('error', message)
    }

    const start = async () => {
      const stripe = stripeInstance.stripe.value
      if (started || unmounted || !mounted || !stripe) return
      started = true

      if (!props.clientSecret && !props.fetchClientSecret) {
        fail('VueStripeEmbeddedCheckout requires a `clientSecret` or `fetchClientSecret` prop')
        return
      }
      if (owner) {
        fail(
          'Only one VueStripeEmbeddedCheckout can be mounted at a time (Stripe allows one Embedded Checkout per page)'
        )
        return
      }
      owner = token

      const options: StripeEmbeddedCheckoutOptions = {
        onComplete: () => emit('complete'),
        onAnalyticsEvent: (event) => emit('analytics', event)
      }
      if (props.clientSecret) options.clientSecret = props.clientSecret
      if (props.fetchClientSecret) options.fetchClientSecret = props.fetchClientSecret
      const onLineItemsChange = props.onLineItemsChange
      if (onLineItemsChange) options.onLineItemsChange = (event) => onLineItemsChange(event)

      try {
        const page = await stripe.createEmbeddedCheckoutPage(options)
        if (unmounted) {
          // Unmounted while Stripe was creating the page.
          page.destroy()
          release()
          return
        }
        checkout.value = markRaw(page)
        page.mount(mountPoint()!)
        loading.value = false
        emit('ready', page)
      } catch (err) {
        checkout.value = null
        release()
        if (unmounted) return
        fail(err instanceof Error ? err.message : 'Failed to create Embedded Checkout')
      }
    }

    watch(
      () => stripeInstance.stripe.value,
      () => void start()
    )
    onMounted(() => {
      mounted = true
      void start()
    })
    onUnmounted(() => {
      unmounted = true
      const page = checkout.value
      if (!page) return
      page.destroy()
      checkout.value = null
      release()
    })

    expose({ checkout, loading, error })

    return () =>
      renderElement(
        'vue-stripe-embedded-checkout',
        { error: error.value, loading: loading.value },
        slots,
        'Loading checkout...'
      )
  }
})
