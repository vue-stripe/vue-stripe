import type { InjectionKey, Ref } from 'vue-demi';
import type {
  Stripe,
  StripeElements,
  StripeCheckout,
  StripeCheckoutSession,
  StripeCheckoutLoadActionsResult
} from '@stripe/stripe-js';

/**
 * The action methods returned by `checkout.loadActions()` (8.x Custom Checkout).
 * In stripe-js 8.x the session methods (confirm, updateEmail, …) live here rather
 * than directly on the StripeCheckout instance.
 */
export type StripeCheckoutActions = Extract<
  StripeCheckoutLoadActionsResult,
  { type: 'success' }
>['actions'];

export interface StripeInstance {
  stripe: Ref<Stripe | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
}

export interface StripeElementsInstance {
  elements: Ref<StripeElements | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
}

export interface StripeCheckoutInstance {
  checkout: Ref<StripeCheckout | null>;
  /** Session methods from checkout.loadActions() (null until loaded). */
  actions: Ref<StripeCheckoutActions | null>;
  session: Ref<StripeCheckoutSession | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
}

export interface VueStripeConfig {
  publishableKey: string;
  stripeAccount?: string | undefined;
  apiVersion?: string | undefined;
  locale?: string | undefined;
}

export const stripeInjectionKey: InjectionKey<StripeInstance> = Symbol('stripe');
export const stripeElementsInjectionKey: InjectionKey<StripeElementsInstance> = Symbol('stripe-elements');
export const stripeCheckoutInjectionKey: InjectionKey<StripeCheckoutInstance> = Symbol('stripe-checkout');
export const stripeConfigInjectionKey: InjectionKey<VueStripeConfig> = Symbol('vue-stripe-config');
