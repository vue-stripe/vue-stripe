import { STRIPE_PARTNER_DETAILS } from '../constants';
import { loadStripe } from '@stripe/stripe-js/dist/pure.esm.js';
console.warn(STRIPE_PARTNER_DETAILS);
export default {
  async install (Vue, options) {
    const {
      pk,
      stripeAccount,
      apiVersion,
      locale,
    } = options;
    Vue.prototype.$stripe = await loadStripe(pk, { stripeAccount, apiVersion, locale })
      .registerAppInfo(STRIPE_PARTNER_DETAILS);
  },
};
