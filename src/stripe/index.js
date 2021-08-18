import {
  STRIPE_PARTNER_DETAILS,
  INSECURE_HOST_ERROR_MESSAGE,
} from '../constants';

import { isSecureHost } from '../utils';
import { loadStripeSdk } from '../load-stripe-sdk';

export default {
  install: (app, options) => {
    if (!isSecureHost()) console.warn(INSECURE_HOST_ERROR_MESSAGE);
    const {
      pk,
      stripeAccount,
      apiVersion,
      locale,
    } = options;

    loadStripeSdk({ version: 'v3', disableAdvancedFraudDetection: false }, () => {
      if (window.Stripe) {
        const stripe = window.Stripe(pk, { stripeAccount, apiVersion, locale });
        stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);

        app.config.globalProperties.$stripe = stripe;
        app.provide('stripe', stripe);
      }
    });
  },
};
