export default {
  async install (Vue, options) {
    const {
      pk,
      stripeAccount,
      apiVersion,
      locale,
      elementsOptions,
    } = options;
    const stripe = window.Stripe(pk, { stripeAccount, apiVersion, locale });
    const elements = stripe.elements(elementsOptions);
    Vue.prototype.$stripe = stripe;
    Vue.prototype.$stripeElements = elements;
  },
};
