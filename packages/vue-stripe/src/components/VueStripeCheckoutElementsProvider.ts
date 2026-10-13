import {
  defineComponent,
  markRaw,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  watch,
  type PropType
} from 'vue-demi'
import type {
  StripeCheckoutElementsOptions,
  StripeCheckoutElementsSdk,
  StripeCheckoutElementsSdkOptions,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutSession
} from '@stripe/stripe-js'
import { stripeCheckoutInjectionKey } from '../utils/injection-keys'
import { injectStripe } from '../utils/inject-stripe'
import { hx } from '../utils/h'
import { statusShell } from '../utils/status-shell'

/**
 * Elements with Checkout Sessions (`stripe.initCheckoutElementsSdk()`).
 *
 * Children render as soon as the SDK exists so elements can mount early; session
 * actions arrive once `loadActions()` resolves (`useCheckoutSession()`, `@ready`).
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripeCheckoutElementsProvider',
  props: {
    /** Client secret of a Checkout Session (`ui_mode: 'elements'`), or a Promise resolving to it. */
    clientSecret: {
      type: [String, Promise] as PropType<string | Promise<string> | undefined>,
      default: undefined
    },
    /** Alternative to `clientSecret`: a function returning the client secret (v5 compatible). */
    fetchClientSecret: {
      type: Function as PropType<(() => Promise<string>) | undefined>,
      default: undefined
    },
    /** Appearance, fonts, loader, saved payment methods and address sync for the Checkout elements. */
    elementsOptions: {
      type: Object as PropType<StripeCheckoutElementsOptions | undefined>,
      default: undefined
    },
    /** Adaptive Pricing (`{ allowed: boolean }`). */
    adaptivePricing: {
      type: Object as PropType<StripeCheckoutElementsSdkOptions['adaptivePricing'] | undefined>,
      default: undefined
    },
    /** Prefill email, phone number and addresses. */
    defaultValues: {
      type: Object as PropType<StripeCheckoutElementsSdkOptions['defaultValues'] | undefined>,
      default: undefined
    }
  },
  emits: ['ready', 'change', 'error'],
  setup(props, { emit, slots }) {
    const stripeInstance = injectStripe('VueStripeCheckoutElementsProvider')

    // Stripe objects are never made deeply reactive.
    const checkout = shallowRef<StripeCheckoutElementsSdk | null>(null)
    const actions = shallowRef<StripeCheckoutLoadActionsSuccess | null>(null)
    const session = shallowRef<StripeCheckoutSession | null>(null)
    const loading = ref(true)
    const error = ref<string | null>(null)

    let started = false
    // Stripe has no way to detach the `change` subscription; this lets late
    // callbacks (and an in-flight loadActions) bail out after teardown.
    let unmounted = false

    const fail = (message: string) => {
      error.value = message
      loading.value = false
      console.error('[Vue Stripe] Checkout init error:', message)
      emit('error', message)
    }

    const start = () => {
      const stripe = stripeInstance.stripe.value
      if (started || !stripe) return

      const clientSecret = props.fetchClientSecret ? props.fetchClientSecret() : props.clientSecret
      if (!clientSecret) {
        fail(
          'VueStripeCheckoutElementsProvider requires a `clientSecret` (string or Promise) or `fetchClientSecret` prop'
        )
        return
      }

      started = true
      try {
        const options: StripeCheckoutElementsSdkOptions = { clientSecret }
        if (props.elementsOptions) options.elementsOptions = props.elementsOptions
        if (props.adaptivePricing) options.adaptivePricing = props.adaptivePricing
        if (props.defaultValues) options.defaultValues = props.defaultValues

        // Synchronous since Stripe.js Clover; children can mount elements right away.
        const sdk = stripe.initCheckoutElementsSdk(options)
        checkout.value = markRaw(sdk)

        sdk.on('change', (next) => {
          if (unmounted) return
          session.value = markRaw(next)
          emit('change', next)
        })

        void sdk.loadActions().then((result) => {
          if (unmounted) return
          if (result.type === 'error') {
            fail(result.error.message)
            return
          }
          actions.value = markRaw(result.actions)
          session.value = markRaw(result.actions.getSession())
          loading.value = false
          emit('ready', result.actions)
        })
      } catch (err) {
        started = false
        checkout.value = null
        fail(err instanceof Error ? err.message : 'Failed to initialize Checkout')
      }
    }

    watch(
      () => stripeInstance.stripe.value,
      (stripe) => {
        if (stripe) start()
      },
      { immediate: true }
    )

    onUnmounted(() => {
      unmounted = true
      checkout.value = null
      actions.value = null
      session.value = null
      started = false
    })

    provide(stripeCheckoutInjectionKey, { checkout, actions, session, loading, error })

    return () => {
      // Without a VueStripeProvider (createVueStripe() only), nothing else shows a Stripe load failure.
      const shownError = error.value ?? stripeInstance.error.value
      return shownError || !checkout.value
        ? statusShell(
            'vue-stripe-checkout',
            { error: shownError, loading: true },
            slots,
            {},
            'Initializing Checkout...'
          )
        : hx(
            'div',
            {},
            slots['default']?.({
              checkout: checkout.value,
              actions: actions.value,
              session: session.value,
              loading: loading.value
            })
          )
    }
  }
})
