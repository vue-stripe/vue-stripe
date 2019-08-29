<template>
  <div>
    <slot name="checkout-button" />
  </div>
</template>

<script>
/**
 * @typedef SKUItem
 */
export default {
  props: {
    /**
     * @type {string} - Stripe's publishable key, from Stripe dashboard.
     */
    publishableKey: {
      type: String,
      required: true,
    },
    /**
     * @type {SKUItem} - Stripe's SKU item.
     */
    items: {
      type: Array
    },
    successUrl: {
      type: String,
      default: window.location.href
    },
    cancelUrl: {
      type: String,
      default: window.location.href
    },
    submitType: {
      type: String,
      default: 'auto',
      validator (value) {
        let supportedValues = ['auto', 'book', 'donate', 'pay'];
        return supportedValues.includes(value);
      }
    },
    billingAddressCollection: {
      type: String,
      default: 'auto',
      validator (value) {
        let supportedValues = ['required', 'auto'];
        return supportedValues.includes(value);
      }
    },
    clientReferenceId: {
      type: String,
    },
    customerEmail: {
      type: String
    },
    sessionId: {
      type: String
    },
    locale: {
      type: String,
      default: 'auto',
      validator (value) {
        let supportedValues = ['auto', 'da', 'de', 'en', 'es', 'fi', 'fr', 'it', 'ja', 'nb', 'nl', 'pl', 'pt', 'sv', 'zh'];
        return supportedValues.includes(value);
      }
    }
  },
  created () {
    const script = document.createElement('script');
    script.id = '_stripe-redirect-to-checkout';
    script.src = 'https://js.stripe.com/v3';
    document.querySelector('head').append(script);
  },
  computed: {
    key () {
      return this.publishableKey;
    },
    stripe () {
      return Stripe(this.key);
    },
    stripeElements () {
      return this.stripe.elements();
    }
  },
  methods: {
    redirectToCheckout () {
      try {
        this.$emit('loading', true);
        this.stripe.redirectToCheckout({
          billingAddressCollection: this.billingAddressCollection,
          cancelUrl: this.cancelUrl,
          clientReferenceId: this.clientReferenceId,
          customerEmail: this.customerEmail,
          items: this.items,
          locale: this.locale,
          sessionId: this.sessionId,
          submitType: this.submitType ,
          successUrl: this.successUrl,
        });
      } catch (e) {
        this.$emit('error', e);
      } finally {
        this.$emit('loading', false);
      }
    },
    /** TODO: Create stripe elements
     * @param {Object} cardElement
     * @param {Object} data - Refer to https://stripe.com/docs/api/payment_methods/create
     */
    async createPaymentMethod (cardElement, data) {
      try {
        this.$emit('loading', true);
        const { paymentMethod } = await this.stripe.createPaymentMethod(
          'card',
          cardElement,
          data
        );
        this.$emit('paymentMethod', paymentMethod);
      } catch (e) {
        this.$emit('error', e);
      } finally {
        this.$emit('loading', false);
      }
    }
  }
}
</script>
