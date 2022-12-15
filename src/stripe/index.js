import {
  STRIPE_PARTNER_DETAILS,
  // INSECURE_HOST_ERROR_MESSAGE,
} from "../constants";
// import { isSecureHost } from '../utils';
export default {
  install: (app, options) => {
    // FIXME: temporarily remove to avoid problems with remote non-production deployments
    // if (!isSecureHost(options.testMode)) console.warn(INSECURE_HOST_ERROR_MESSAGE);
    const { pk, stripeAccount, apiVersion, locale } = options;
    const stripe = window.Stripe(pk, { stripeAccount, apiVersion, locale });
    stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
    app.config.globalProperties.$stripe = stripe;
  },
};
