import { defineComponent, onMounted, provide, ref, shallowRef, type PropType } from 'vue-demi'
import type { Stripe, StripeConstructorOptions } from '@stripe/stripe-js'
import {
  stripeConfigInjectionKey,
  stripeInjectionKey,
  type VueStripeConfig
} from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'
import { loadStripeInstance } from '../utils/load-stripe'
import { statusShell } from '../utils/status-shell'
import type { VueStripeComponent } from '../utils/element-types'

const providerProps = {
  publishableKey: { type: String as PropType<string | undefined>, default: undefined },
  /** @deprecated v4 alias of `publishableKey`. */
  stripeKey: { type: String as PropType<string | undefined>, default: undefined },
  stripeAccount: { type: String as PropType<string | undefined>, default: undefined },
  /** @deprecated Versioned Stripe.js (Endive) always uses its release train's API version and ignores this; it is still forwarded to `loadStripe()`. */
  apiVersion: { type: String as PropType<string | undefined>, default: undefined },
  locale: { type: String as PropType<string | undefined>, default: undefined },
  /** Stripe beta flags, e.g. the Tax ID Element's beta (forwarded to `loadStripe`). */
  betas: { type: Array as PropType<string[] | undefined>, default: undefined },
  /** Stripe.js developer tooling, e.g. `{ assistant: { enabled: false } }` (forwarded to `loadStripe`). */
  developerTools: {
    type: Object as PropType<StripeConstructorOptions['developerTools']>,
    default: undefined
  },
  /** `false` loads Stripe.js without advanced fraud signals (Radar). Read once, before Stripe.js loads. */
  advancedFraudSignals: { type: Boolean, default: true },
  /** Any `loadStripe()` option (`stripeAccount`, `apiVersion`, `locale`, `betas`, `developerTools`). Explicit props win. */
  options: { type: Object as PropType<StripeConstructorOptions | undefined>, default: undefined }
}

/** Event name -> payload. */
type ProviderEvents = {
  load: [stripe: Stripe]
  error: [error: Error]
}

/**
 * Loads Stripe.js and provides the Stripe instance to everything inside it.
 * Children render once Stripe is ready; `#loading` and `#error` slots cover the rest.
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripeProvider',
  props: providerProps,
  emits: ['load', 'error'] satisfies Array<keyof ProviderEvents>,
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
        if (props.developerTools) options.developerTools = props.developerTools
        if (stripeAccount) options.stripeAccount = stripeAccount
        if (apiVersion) options.apiVersion = apiVersion
        if (locale) options.locale = locale as NonNullable<StripeConstructorOptions['locale']>

        stripe.value = await loadStripeInstance(key, options, props.advancedFraudSignals)
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
}) as unknown as VueStripeComponent<typeof providerProps, Record<never, never>, ProviderEvents>
