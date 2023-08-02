import { loadStripe } from '@stripe/stripe-js';
import { ref } from 'vue';
import { STRIPE_PARTNER_DETAILS } from '../constants';

export default () => {
  const stripe = ref(null);

  async function initialize (pk, options) {
    if (options?.disableAdvancedFraudDetection) loadStripe.setLoadParameters({ advancedFraudSignals: false });
    const stripeOptions = {
      stripeAccount: options?.stripeAccount,
      apiVersion: options?.apiVersion,
      locale: options?.locale,
    };
    stripe.value = await loadStripe(pk, stripeOptions);
    stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
    return stripe.value;
  }

  return {
    stripe,
    initialize,
  };
};
