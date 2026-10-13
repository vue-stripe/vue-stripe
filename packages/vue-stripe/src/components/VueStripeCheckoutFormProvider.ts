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
  StripeCheckoutFormLoadActionsSuccess,
  StripeCheckoutFormSdk,
  StripeCheckoutFormSdkOptions,
  StripeCheckoutSession
} from '@stripe/stripe-js'
import { stripeCheckoutFormInjectionKey } from '../utils/injection-keys'
import { injectStripe } from '../utils/inject-stripe'
import { hx } from '../utils/h'
import { statusShell } from '../utils/status-shell'

/**
 * Checkout Form (`stripe.initCheckoutFormSdk()`, `ui_mode: 'form'`). Stripe beta:
 * the account needs Checkout Form access.
 *
 * Children render as soon as the SDK exists so `<VueStripeCheckoutForm>` can mount
 * early; session actions arrive once `loadActions()` resolves (`useCheckoutForm()`, `@ready`).
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripeCheckoutFormProvider',
  props: {
    /** Client secret of a Checkout Session (`ui_mode: 'form'`), or a Promise resolving to it. */
    clientSecret: {
      type: [String, Promise] as PropType<string | Promise<string> | undefined>,
      default: undefined
    },
    /** Alternative to `clientSecret`: a function returning the client secret. */
    fetchClientSecret: {
      type: Function as PropType<(() => Promise<string>) | undefined>,
      default: undefined
    },
    /** Appearance of the form (Stripe's `Appearance` without `rules`). */
    appearance: {
      type: Object as PropType<StripeCheckoutFormSdkOptions['appearance'] | undefined>,
      default: undefined
    },
    /** When to show the loader: `'auto'`, `'always'` or `'never'`. */
    loader: {
      type: String as PropType<StripeCheckoutFormSdkOptions['loader'] | undefined>,
      default: undefined
    },
    /** Custom fonts for the form. */
    fonts: {
      type: Array as PropType<StripeCheckoutFormSdkOptions['fonts'] | undefined>,
      default: undefined
    },
    /** Saved payment methods (`enableSave`, `enableRedisplay`). */
    savedPaymentMethod: {
      type: Object as PropType<StripeCheckoutFormSdkOptions['savedPaymentMethod'] | undefined>,
      default: undefined
    },
    /** Prefill email, phone number and addresses. */
    defaultValues: {
      type: Object as PropType<StripeCheckoutFormSdkOptions['defaultValues'] | undefined>,
      default: undefined
    }
  },
  emits: ['ready', 'change', 'error'],
  setup(props, { emit, slots }) {
    const stripeInstance = injectStripe('VueStripeCheckoutFormProvider')

    // Stripe objects are never made deeply reactive.
    const checkout = shallowRef<StripeCheckoutFormSdk | null>(null)
    const actions = shallowRef<StripeCheckoutFormLoadActionsSuccess | null>(null)
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
      console.error('[Vue Stripe] Checkout Form init error:', message)
      emit('error', message)
    }

    const start = () => {
      const stripe = stripeInstance.stripe.value
      if (started || !stripe) return

      const clientSecret = props.fetchClientSecret ? props.fetchClientSecret() : props.clientSecret
      if (!clientSecret) {
        fail(
          'VueStripeCheckoutFormProvider requires a `clientSecret` (string or Promise) or `fetchClientSecret` prop'
        )
        return
      }

      started = true
      try {
        const options: StripeCheckoutFormSdkOptions = { clientSecret }
        if (props.appearance) options.appearance = props.appearance
        if (props.loader) options.loader = props.loader
        if (props.fonts) options.fonts = props.fonts
        if (props.savedPaymentMethod) options.savedPaymentMethod = props.savedPaymentMethod
        if (props.defaultValues) options.defaultValues = props.defaultValues

        // Synchronous like initCheckoutElementsSdk; children can mount the form right away.
        const sdk = stripe.initCheckoutFormSdk(options)
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
        fail(err instanceof Error ? err.message : 'Failed to initialize the Checkout Form')
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

    provide(stripeCheckoutFormInjectionKey, { checkout, actions, session, loading, error })

    return () =>
      error.value || !checkout.value
        ? statusShell(
            'vue-stripe-checkout',
            { error: error.value, loading: true },
            slots,
            {},
            'Initializing Checkout Form...'
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
})
