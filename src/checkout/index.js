import {
  STRIPE_PARTNER_DETAILS,
  INSECURE_HOST_ERROR_MESSAGE,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} from '../constants';
import { loadStripe } from '@stripe/stripe-js/dist/pure.esm.js';
import { isSecureHost } from '../utils';
import props from './props';

import { h, computed } from 'vue';

function render () {
  return h('div', {});
}

export default {
  props,
  render,
  setup (props, { emit }) {
    if (!isSecureHost()) console.warn(INSECURE_HOST_ERROR_MESSAGE);

    const locale = computed(() => {
      if (SUPPORTED_LOCALES.includes(props.locale)) return props.locale;
      console.warn(`VueStripe Warning: '${props.locale}' is not supported by Stripe yet. Falling back to default '${DEFAULT_LOCALE}'.`);
      return DEFAULT_LOCALE;
    });

    const redirectToCheckout = async () => {
      try {
        if (!isSecureHost()) {
          throw Error(INSECURE_HOST_ERROR_MESSAGE);
        }

        emit('loading', true);

        if (props.disableAdvancedFraudDetection) loadStripe.setLoadParameters({ advancedFraudSignals: false });

        const stripe = await loadStripe(props.pk);
        stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);

        if (props.sessionId) {
          stripe.redirectToCheckout({
            sessionId: props.sessionId,
          });

          return;
        }

        if (props.lineItems && props.lineItems.length && !props.mode) {
          console.error('Error: Property \'mode\' is required when using \'lineItems\'. See https://stripe.com/docs/js/checkout/redirect_to_checkout#stripe_checkout_redirect_to_checkout-options-mode');
          return;
        }

        const options = {
          billingAddressCollection: props.billingAddressCollection,
          cancelUrl: props.cancelUrl,
          clientReferenceId: props.clientReferenceId,
          customerEmail: props.customerEmail,
          items: props.items,
          lineItems: props.lineItems,
          locale: locale.value,
          mode: props.mode,
          shippingAddressCollection: props.shippingAddressCollection,
          submitType: props.submitType,
          successUrl: props.successUrl,
        };

        stripe.redirectToCheckout(options);
      } catch (error) {
        emit('error', error);
      }
    };

    return {
      redirectToCheckout,
    };
  },
};
