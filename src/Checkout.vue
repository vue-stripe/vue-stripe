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
      type: String
    }
  },
  mounted () {
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
    }
  },
  methods: {
    redirectToCheckout () {
      try {
        this.$emit('loading', true);
        this.stripe.redirectToCheckout({
          items: this.items,
          successUrl: this.successUrl,
          cancelUrl: this.cancelUrl,
          submitType: this.submitType 
        });
      } catch (e) {
        this.$emit('error', e);
      } finally {
        this.$emit('loading', false);
      }
    }
  }
}
</script>
