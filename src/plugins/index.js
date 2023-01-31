import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PARTNER_DETAILS } from '../constants';

export default {
  async install (app, { pk, stripeAccount, apiVersion, locale }) {
    if (!pk) throw new Error('Publishable key is required');
    const stripeOptions = {};
    if (stripeAccount) stripeOptions.stripeAccount = stripeAccount;
    if (apiVersion) stripeOptions.apiVersion = apiVersion;
    if (locale) stripeOptions.locale = locale;
    const stripe = await loadStripe(pk, stripeOptions);
    stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
    app.mixin({
      computed: {
        $stripe () {
          return stripe;
        },
      },
    });
    app.provide('$stripe', stripe);
  },
};
