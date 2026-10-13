import type { InjectionKey, Ref } from 'vue-demi'
import type {
  Stripe,
  StripeElements,
  StripeCheckoutElementsSdk,
  StripeCheckoutFormLoadActionsSuccess,
  StripeCheckoutFormSdk,
  StripeCheckoutLoadActionsSuccess,
  StripeCheckoutSession
} from '@stripe/stripe-js'

export interface StripeInstance {
  stripe: Ref<Stripe | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}

export interface StripeElementsInstance {
  elements: Ref<StripeElements | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  /** Whether the group is created with a `clientSecret` or a `mode` (deferred Intent). */
  hasIntent?: () => boolean
}

export interface StripeCheckoutInstance {
  /** Checkout Elements SDK handle (`stripe.initCheckoutElementsSdk()`, synchronous). */
  checkout: Ref<StripeCheckoutElementsSdk | null>
  /** Session actions, available once `checkout.loadActions()` resolves. */
  actions: Ref<StripeCheckoutLoadActionsSuccess | null>
  session: Ref<StripeCheckoutSession | null>
  /** True until `loadActions()` settles. */
  loading: Ref<boolean>
  error: Ref<string | null>
}

export interface StripeCheckoutFormInstance {
  /** Checkout Form SDK handle (`stripe.initCheckoutFormSdk()`, synchronous; Stripe beta). */
  checkout: Ref<StripeCheckoutFormSdk | null>
  /** Form SDK actions, available once `checkout.loadActions()` resolves. */
  actions: Ref<StripeCheckoutFormLoadActionsSuccess | null>
  session: Ref<StripeCheckoutSession | null>
  /** True until `loadActions()` settles. */
  loading: Ref<boolean>
  error: Ref<string | null>
}

export interface VueStripeConfig {
  publishableKey: string
  stripeAccount?: string | undefined
  apiVersion?: string | undefined
  locale?: string | undefined
}

export const stripeInjectionKey: InjectionKey<StripeInstance> = Symbol('stripe')
export const stripeElementsInjectionKey: InjectionKey<StripeElementsInstance> =
  Symbol('stripe-elements')
export const stripeCheckoutInjectionKey: InjectionKey<StripeCheckoutInstance> =
  Symbol('stripe-checkout')
export const stripeCheckoutFormInjectionKey: InjectionKey<StripeCheckoutFormInstance> =
  Symbol('stripe-checkout-form')
export const stripeConfigInjectionKey: InjectionKey<VueStripeConfig> = Symbol('vue-stripe-config')
