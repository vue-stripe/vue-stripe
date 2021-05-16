import { STRIPE_PARTNER_DETAILS } from '../constants';
export default {
  install (Vue, options) {
    const {
      pk,
      stripeAccount,
      apiVersion,
      locale,
    } = options;
    const stripe = window.Stripe(pk, { stripeAccount, apiVersion, locale });
    stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
    Vue.prototype.$stripe = stripe;
  },
};
