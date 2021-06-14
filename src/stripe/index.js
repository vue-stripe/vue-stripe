import {
  STRIPE_PARTNER_DETAILS,
  INSECURE_HOST_ERROR_MESSAGE,
} from '../constants';
import { isSecureHost } from '../utils';
export default {
  install (Vue, options) {
    if (!isSecureHost()) console.warn(INSECURE_HOST_ERROR_MESSAGE);
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
