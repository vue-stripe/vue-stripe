<template>
  <div>
    <slot name="checkout-button">
      <button @click="redirectToCheckout">Checkout</button>
    </slot>
  </div>
</template>

<script>
import {
  SUPPORTED_LANGS,
  SUPPORTED_SUBMIT_TYPES,
  BILLING_ADDRESS_COLLECTION_TYPES
} from './constants';
import { loadStripeSdk } from './load-checkout';
export default {
  props: {
    pk: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      validator: value => ['payment', 'subscription'].includes(value),
    },
    lineItems: {
      type: Array,
    },
    items: {
      type: Array,
    },
    successUrl: {
      type: String,
      default: window.location.href,
    },
    cancelUrl: {
      type: String,
      default: window.location.href,
    },
    submitType: {
      type: String,
      validator: (value) => SUPPORTED_SUBMIT_TYPES.includes(value),
    },
    billingAddressCollection: {
      type: String,
      default: 'auto',
      validator: (value) => BILLING_ADDRESS_COLLECTION_TYPES.includes(value),
    },
    clientReferenceId: {
      type: String,
    },
    customerEmail: {
      type: String,
    },
    sessionId: {
      type: String,
    },
    locale: {
      type: String,
      default: 'auto',
      validator: value => SUPPORTED_LANGS.includes(value),
    },
    shippingAddressCollection: {
      type: Object,
      validator: value => value.hasOwnProperty('allowedCountries'),
    },
  },
  methods: {
    redirectToCheckout () {
      this.$emit('loading', true);
      loadStripeSdk(this.pk, 'v3', () => {
        try {
          let stripe = window.Stripe(this.pk);

          if (this.sessionId) {
            stripe.redirectToCheckout({
              sessionId: this.sessionId
            });
            return;
          }

          if (this.lineItems?.length && !this.mode) {
            console.error(`Error: Property 'mode' is required when using 'lineItems'. See https://stripe.com/docs/js/checkout/redirect_to_checkout#stripe_checkout_redirect_to_checkout-options-mode`);
            return;
          }

          const options = {
            billingAddressCollection: this.billingAddressCollection,
            cancelUrl: this.cancelUrl,
            clientReferenceId: this.clientReferenceId,
            customerEmail: this.customerEmail,
            items: this.items,
            lineItems: this.lineItems,
            locale: this.locale,
            mode: this.mode,
            shippingAddressCollection: this.shippingAddressCollection,
            submitType: this.submitType,
            successUrl: this.successUrl,
          };

          stripe.redirectToCheckout(options);
        } catch (e) {
          console.error(e);
          this.$emit('error', e);
        } finally {
          this.$emit('loading', false);
        }
      });
    }
  }
}
</script>
