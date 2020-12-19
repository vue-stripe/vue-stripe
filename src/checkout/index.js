import { loadStripeSdk } from '../load-stripe-sdk';
import props from './props';
export default {
  props,
  template: '<div></div>',
  methods: {
    redirectToCheckout () {
      this.$emit('loading', true);
      loadStripeSdk('v3', () => {
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
};
