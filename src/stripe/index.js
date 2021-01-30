export default {
  install (Vue, options) {
    const {
      pk,
      stripeAccount,
      apiVersion,
      locale,
    } = options;
    Vue.prototype.$stripe = window.Stripe(pk, { stripeAccount, apiVersion, locale });
  },
};
