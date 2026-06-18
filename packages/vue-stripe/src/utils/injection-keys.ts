import type { InjectionKey, Ref } from 'vue-demi';
import type { Stripe, StripeElements, StripeCheckout, StripeCheckoutSession } from '@stripe/stripe-js';

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