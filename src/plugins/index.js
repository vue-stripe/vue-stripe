import { loadStripe } from '@stripe/stripe-js';
// import { STRIPE_PARTNER_DETAILS } from '../constants';

export default {
  async install (app, options) {
    const pk = options?.pk;
    const stripeOptions = {};
    if (options?.stripeAccount) stripeOptions.stripeAccount = options.stripeAccount;
    if (options?.apiVersion) stripeOptions.apiVersion = options.apiVersion;
    if (options?.locale) stripeOptions.locale = options.locale;
    const stripe = await loadStripe(pk, stripeOptions);
    // stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
    app.config.globalProperties.$axios = stripe;
  },
};
