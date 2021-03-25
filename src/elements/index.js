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
    const stripe = await loadStripe(pk, { stripeAccount, apiVersion, locale });
    const elements = stripe.elements(elementsOptions);
    Vue.prototype.$stripe = stripe;
    Vue.prototype.$stripeElements = elements;
  },
};
