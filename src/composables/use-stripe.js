import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PARTNER_DETAILS } from '../constants';

export function useStripe () {
  console.log('useStripe');
  console.log(import.meta.env);
  async function initializeStripe (pk, options) {
    if (options?.disableAdvancedFraudDetection) loadStripe.setLoadParameters({ advancedFraudSignals: false });
    const stripeOptions = {
      stripeAccount: options?.stripeAccount,
      apiVersion: options?.apiVersion,
      locale: options?.locale,
    };
    const stripe = await loadStripe(pk, stripeOptions);
    stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
    return stripe;
  }

  return {
    initializeStripe,
  };
};