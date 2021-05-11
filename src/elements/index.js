import { STRIPE_PARTNER_DETAILS } from '../constants';
import { loadStripe } from '@stripe/stripe-js/dist/pure.esm.js';
export default {
  async install (Vue, options) {
    const {
      pk,
      stripeAccount,
      apiVersion,
      locale,
      elementsOptions,
    } = options;
    const stripe = await loadStripe(pk, { stripeAccount, apiVersion, locale })
      .registerAppInfo(STRIPE_PARTNER_DETAILS);
    const elements = stripe.elements(elementsOptions);
    Vue.prototype.$stripe = stripe;
    Vue.prototype.$stripeElements = elements;
  },
};
