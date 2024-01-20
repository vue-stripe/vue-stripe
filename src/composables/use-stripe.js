import { provide } from 'vue-demi';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PARTNER_DETAILS } from '../constants';

export function useStripe () {
  async function initializeStripe (pk, options) {
    if (options?.disableAdvancedFraudDetection) loadStripe.setLoadParameters({ advancedFraudSignals: false });
    const stripeOptions = {
      stripeAccount: options?.stripeAccount,
      apiVersion: options?.apiVersion,
      locale: options?.locale,
    };
    const stripe = await loadStripe(pk, stripeOptions);
    stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
    provide('stripe-instance', stripe);
    return stripe;
  }

  return {
    initializeStripe,
  };
};