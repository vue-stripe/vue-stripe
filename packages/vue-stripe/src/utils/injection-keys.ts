import type { InjectionKey, Ref } from 'vue-demi';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

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

export const stripeInjectionKey: InjectionKey<StripeInstance> = Symbol('stripe');
export const stripeElementsInjectionKey: InjectionKey<StripeElementsInstance> = Symbol('stripe-elements');