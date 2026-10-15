import {
  defineComponent,
  getCurrentInstance,
  markRaw,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  type PropType,
  type Ref,
  type ShallowRef
} from 'vue-demi'
import type {
  StripeEmbeddedCheckout,
  StripeEmbeddedCheckoutAnalyticsEventUnion,
  StripeEmbeddedCheckoutOptions
} from '@stripe/stripe-js'
import { injectStripe } from '../utils/inject-stripe'
import { renderAfterSetupError } from '../utils/h'
import { renderElement } from '../utils/element-render'
import { errorLogger, listenerCheck } from '../utils/report'
import type { VueStripeComponent } from '../utils/element-types'

// Stripe.js allows one Embedded Checkout per page; this is the instance holding it.
let owner: object | null = null

const embeddedCheckoutProps = {
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
}

/** Template ref members. */
type EmbeddedCheckoutExposed = {
  /** The Embedded Checkout instance once created. */
  checkout: ShallowRef<StripeEmbeddedCheckout | null>
  /** `true` until the page is mounted. */
  loading: Ref<boolean>
  /** Message of the last failure. */
  error: Ref<string | null>
}

/** Event name -> payload. */
type EmbeddedCheckoutEvents = {
  ready: [checkout: StripeEmbeddedCheckout]
  complete: []
  analytics: [event: StripeEmbeddedCheckoutAnalyticsEventUnion]
  error: [message: string]
}

/**
 * Stripe's prebuilt Checkout page embedded in your site
 * (`stripe.createEmbeddedCheckoutPage()`, `ui_mode: 'embedded_page'`).
 *
 * Mounts once Stripe has loaded and destroys the page on unmount. To switch to
 * another Checkout Session, re-mount the component (e.g. change its `key`).
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripeEmbeddedCheckout',
  props: embeddedCheckoutProps,
  emits: ['ready', 'complete', 'analytics', 'error'] satisfies Array<keyof EmbeddedCheckoutEvents>,
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

    const logError = errorLogger(slots)
    const listens = listenerCheck()
    const fail = (message: string) => {
      error.value = message
      loading.value = false
      logError('Embedded Checkout error', message)
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

      // Callbacks only for listeners: Stripe.js warns about an onComplete it will never call,
      // on every load of a session that redirects on completion (the default) (#688).
      const options: StripeEmbeddedCheckoutOptions = {}
      if (listens('complete')) options.onComplete = () => emit('complete')
      if (listens('analytics')) options.onAnalyticsEvent = (event) => emit('analytics', event)
      const onLineItemsChange = props.onLineItemsChange
      if (onLineItemsChange) options.onLineItemsChange = (event) => onLineItemsChange(event)

      try {
        // fetchClientSecret is resolved here, not handed to Stripe: Stripe calls it after the
        // page is created and reports a failure (or a session that is not embedded_page) only
        // inside its iframe and as an uncaught IntegrationError (#684).
        const clientSecret: unknown = props.clientSecret || (await props.fetchClientSecret?.())
        if (unmounted) return release()
        if (!clientSecret || typeof clientSecret !== 'string') {
          release()
          fail('fetchClientSecret did not resolve to a client secret')
          return
        }
        options.clientSecret = clientSecret
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
      // Also frees the page slot while the client secret is still being fetched.
      release()
      const page = checkout.value
      if (!page) return
      page.destroy()
      checkout.value = null
    })

    expose({ checkout, loading, error } satisfies EmbeddedCheckoutExposed)

    return () =>
      renderElement(
        'vue-stripe-embedded-checkout',
        { error: error.value, loading: loading.value },
        slots,
        'Loading checkout...'
      )
  },
  render: renderAfterSetupError
}) as unknown as VueStripeComponent<
  typeof embeddedCheckoutProps,
  EmbeddedCheckoutExposed,
  EmbeddedCheckoutEvents
>
