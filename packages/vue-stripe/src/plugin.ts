import type { App, Plugin } from 'vue-demi'
import type { VueStripeOptions } from './types'
import { stripeConfigInjectionKey, type VueStripeConfig } from './utils/injection-keys'

/**
 * Vue Stripe Plugin
 *
 * Registers Vue Stripe app-wide configuration. The config is provided under the
 * shared {@link stripeConfigInjectionKey}, so config-only components such as
 * `<VueStripePricingTable>` work without an explicit `<VueStripeProvider>`.
 *
 * NOTE: the plugin does NOT yet expose a reactive Stripe instance to
 * `useStripe()` / `<VueStripeElements>` — those still require a
 * `<VueStripeProvider>` wrapper. A full plugin-level global provider is tracked
 * in https://github.com/vue-stripe/vue-stripe/issues/424.
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
  return {
    install(app: App) {
      const config: VueStripeConfig = {
        publishableKey: options.publishableKey,
        stripeAccount: options.stripeAccount,
        apiVersion: options.apiVersion,
        locale: options.locale
      }

      // Provide global config under the shared injection key that components
      // actually inject (previously provided under a mismatched string key).
      app.provide(stripeConfigInjectionKey, config)
    }
  }
}
