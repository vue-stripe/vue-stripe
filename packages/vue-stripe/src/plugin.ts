import { isVue2, ref, shallowRef, type App, type Plugin } from 'vue-demi'
import type { Stripe, StripeConstructorOptions } from '@stripe/stripe-js'
import type { VueStripeOptions } from './types'
import {
  stripeConfigInjectionKey,
  stripeInjectionKey,
  type StripeInstance,
  type VueStripeConfig
} from './utils/injection-keys'
import { loadStripeInstance } from './utils/load-stripe'

/**
 * A `StripeInstance` that calls `loadStripe()` the first time a consumer reads
 * it (`useStripe()`, `<VueStripeElements>`, ...), and never on the server.
 * Apps that install the plugin but render no Stripe UI load nothing.
 */
function createLazyStripeInstance(options: VueStripeOptions): StripeInstance {
  // shallowRef: Stripe's instance must never be made deeply reactive.
  const stripe = shallowRef<Stripe | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  let started = false

  const load = () => {
    if (started || typeof window === 'undefined') return
    started = true

    const loadOptions: StripeConstructorOptions = {}
    if (options.stripeAccount) loadOptions.stripeAccount = options.stripeAccount
    if (options.apiVersion) loadOptions.apiVersion = options.apiVersion
    if (options.locale) loadOptions.locale = options.locale

    loadStripeInstance(options.publishableKey, loadOptions)
      .then((instance) => {
        stripe.value = instance
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load Stripe'
        error.value = message
        console.error('[Vue Stripe] Initialization error:', message)
      })
      .finally(() => {
        loading.value = false
      })
  }

  return {
    get stripe() {
      load()
      return stripe
    },
    get loading() {
      load()
      return loading
    },
    get error() {
      load()
      return error
    }
  }
}

/**
 * Vue Stripe Plugin
 *
 * App-wide alternative to `<VueStripeProvider>`. Provides the config under
 * {@link stripeConfigInjectionKey} and a Stripe instance under
 * {@link stripeInjectionKey}, so `useStripe()`, `<VueStripeElements>`, the
 * element components and `<VueStripePricingTable>` work without a provider.
 * Stripe.js loads once, the first time something needs it. A nested
 * `<VueStripeProvider>` still wins for everything inside it.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { createVueStripe } from '@vue-stripe/vue-stripe'
 *
 * const app = createApp(App)
 * app.use(createVueStripe({
 *   publishableKey: 'pk_test_...',
 *   stripeAccount: 'acct_...', // optional
 *   apiVersion: '2023-10-16', // optional
 *   locale: 'en' // optional
 * }))
 * ```
 */
export function createVueStripe(options: VueStripeOptions): Plugin {
  const config: VueStripeConfig = {
    publishableKey: options.publishableKey,
    stripeAccount: options.stripeAccount,
    apiVersion: options.apiVersion,
    locale: options.locale
  }
  const instance = createLazyStripeInstance(options)

  return {
    install(app: App) {
      if (isVue2) {
        // Vue 2.7: `app` is the Vue constructor, which has no app.provide().
        // Provide from root instances only, so a nested VueStripeProvider's
        // own provide() is never overwritten by the mixin.
        app.mixin({
          provide(this: { $root: unknown }) {
            return this.$root === this
              ? { [stripeConfigInjectionKey]: config, [stripeInjectionKey]: instance }
              : {}
          }
        })
        return
      }
      app.provide(stripeConfigInjectionKey, config)
      app.provide(stripeInjectionKey, instance)
    }
  }
}
