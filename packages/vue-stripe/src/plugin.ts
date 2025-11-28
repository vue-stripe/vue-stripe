import type { App, Plugin } from 'vue-demi'
import type { VueStripeOptions } from './types'
import { loadStripe, type Stripe, type StripeConstructorOptions } from '@stripe/stripe-js'

/**
 * Vue Stripe Plugin
 * 
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { createVueStripe } from '@vue-stripe/vue-stripe'
 * 
 * const app = createApp(App)
 * const vueStripe = createVueStripe({
 *   publishableKey: 'pk_test_...',
 *   stripeAccount: 'acct_...', // optional
 *   apiVersion: '2023-10-16', // optional
 *   locale: 'en' // optional
 * })
 * 
 * app.use(vueStripe)
 * ```
 */
export function createVueStripe(options: VueStripeOptions): Plugin {
  return {
    install(app: App) {
      // Provide global stripe config
      app.provide('vue-stripe-config', options)
      
      // Provide global stripe instance (lazy loaded)
      let stripeInstance: Promise<Stripe | null> | null = null

      app.provide('vue-stripe-global', {
        get stripe() {
          if (!stripeInstance) {
            const loadStripeOptions: StripeConstructorOptions = {}
            if (options.stripeAccount) loadStripeOptions.stripeAccount = options.stripeAccount
            if (options.apiVersion) loadStripeOptions.apiVersion = options.apiVersion
            if (options.locale) loadStripeOptions.locale = options.locale

            stripeInstance = loadStripe(options.publishableKey, loadStripeOptions)
          }
          return stripeInstance
        }
      })
    }
  }
}

export default createVueStripe