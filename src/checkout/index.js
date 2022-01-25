import {
  STRIPE_PARTNER_DETAILS,
  INSECURE_HOST_ERROR_MESSAGE,
} from '../constants';
import { loadStripe } from '@stripe/stripe-js/dist/pure.esm.js';
import { isSecureHost } from '../utils';
import CoercePropsMixin from 'vue-coerce-props';
import props from './props';
export default {
  props,
  mixins: [CoercePropsMixin],
  render (element) {
    return element;
  },
  mounted () {
    if (!isSecureHost()) console.warn(INSECURE_HOST_ERROR_MESSAGE);
  },
  methods: {
    async redirectToCheckout () {
      try {
        if (!isSecureHost()) {
          throw Error(INSECURE_HOST_ERROR_MESSAGE);
        }

        this.$emit('loading', true);

        if (this.disableAdvancedFraudDetection) loadStripe.setLoadParameters({ advancedFraudSignals: false });

        const stripe = await loadStripe(this.pk);
        stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);

        if (this.sessionId) {
          stripe.redirectToCheckout({
            sessionId: this.sessionId,
          });
          return;
        }

        if (this.lineItems && this.lineItems.length && !this.mode) {
          console.error('Error: Property \'mode\' is required when using \'lineItems\'. See https://stripe.com/docs/js/checkout/redirect_to_checkout#stripe_checkout_redirect_to_checkout-options-mode');
          return;
        }

        const options = {
          billingAddressCollection: this.billingAddressCollection,
          cancelUrl: this.cancelUrl,
          clientReferenceId: this.clientReferenceId,
          customerEmail: this.customerEmail,
          items: this.items,
          lineItems: this.lineItems,
          locale: this.$coerced.locale,
          mode: this.mode,
          shippingAddressCollection: this.shippingAddressCollection,
          submitType: this.submitType,
          successUrl: this.successUrl,
        };

        return stripe.redirectToCheckout(options);
      } catch (e) {
        console.error(e);
        this.$emit('error', e);
      }
    },
  },
};
