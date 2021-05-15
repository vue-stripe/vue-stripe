import { STRIPE_PARTNER_DETAILS } from '../constants';
console.warn(STRIPE_PARTNER_DETAILS);
export default {
  install (Vue, options) {
    const {
      pk,
      stripeAccount,
      apiVersion,
      locale,
    } = options;
    Vue.prototype.$stripe = window.Stripe(pk, { stripeAccount, apiVersion, locale })
      .registerAppInfo(STRIPE_PARTNER_DETAILS);
  },
};
