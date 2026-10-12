import { defineComponent, onMounted, provide, ref, shallowRef, type PropType } from 'vue-demi'
import { loadStripe, type Stripe, type StripeConstructorOptions } from '@stripe/stripe-js'
import {
  stripeConfigInjectionKey,
  stripeInjectionKey,
  type VueStripeConfig
} from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'
import { STRIPE_PARTNER_DETAILS } from '../utils/constants'
import { statusShell } from '../utils/status-shell'

/**
 * Loads Stripe.js and provides the Stripe instance to everything inside it.
 * Children render once Stripe is ready; `#loading` and `#error` slots cover the rest.
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripeProvider',
  props: {
    publishableKey: { type: String as PropType<string | undefined>, default: undefined },
    /** @deprecated v4 alias of `publishableKey`. */
    stripeKey: { type: String as PropType<string | undefined>, default: undefined },
    stripeAccount: { type: String as PropType<string | undefined>, default: undefined },
    apiVersion: { type: String as PropType<string | undefined>, default: undefined },
    locale: { type: String as PropType<string | undefined>, default: undefined },
    /** Stripe beta flags, e.g. the Tax ID Element's beta (forwarded to `loadStripe`). */
    betas: { type: Array as PropType<string[] | undefined>, default: undefined },
    /** Any `loadStripe()` option (`stripeAccount`, `apiVersion`, `locale`, `betas`, ...). Explicit props win. */
    options: { type: Object as PropType<StripeConstructorOptions | undefined>, default: undefined }
  },
  emits: ['load', 'error'],
  setup(props, { emit, slots }) {
    // Support both publishableKey and stripeKey for backwards compatibility
    const key = props.publishableKey || props.stripeKey
    if (!key) {
      throw new VueStripeProviderError('publishableKey or stripeKey is required')
    }

    // shallowRef: Stripe's instance must never be made deeply reactive.
    const stripe = shallowRef<Stripe | null>(null)
    const loading = ref(true)
    const error = ref<string | null>(null)

    const stripeAccount = props.stripeAccount || props.options?.stripeAccount
    const apiVersion = props.apiVersion || props.options?.apiVersion
    const locale = props.locale || props.options?.locale

    const config: VueStripeConfig = { publishableKey: key, stripeAccount, apiVersion, locale }

    const initialize = async () => {
      try {
        loading.value = true
        error.value = null

        // Start from every loadStripe() option given in `options`; explicit props win.
        const options: StripeConstructorOptions = { ...props.options }
        if (props.betas?.length) options.betas = props.betas
        if (stripeAccount) options.stripeAccount = stripeAccount
        if (apiVersion) options.apiVersion = apiVersion
        if (locale) options.locale = locale as NonNullable<StripeConstructorOptions['locale']>

        stripe.value = await loadStripe(key, options)
        if (!stripe.value) {
          throw new VueStripeProviderError('Failed to initialize Stripe')
        }
        stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS)
        emit('load', stripe.value)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Stripe'
        error.value = errorMessage
        console.error('[Vue Stripe] Initialization error:', errorMessage)
        emit('error', err instanceof Error ? err : new Error(errorMessage))
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      void initialize()
    })

    provide(stripeConfigInjectionKey, config)
    provide(stripeInjectionKey, { stripe, loading, error })

    return () =>
      statusShell(
        'vue-stripe',
        { error: error.value, loading: loading.value },
        slots,
        {},
        'Loading Stripe...'
      )
  }
})
