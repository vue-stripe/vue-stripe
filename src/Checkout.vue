<template>
  <div>
    <slot name="checkout-button" />
  </div>
</template>

<script>
export default {
  props: {
    publishableKey: {
      type: String,
      required: true,
    },
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
    }
  },
  methods: {
    redirectToCheckout () {
      try {
        this.$emit('loading', true);
        Stripe(this.key).redirectToCheckout({
          items: this.items,
          successUrl: this.successUrl,
          cancelUrl: this.cancelUrl,
        });
      } catch (e) {
        
      } finally {
        this.$emit('loading', false);
      }
    }
  }
}
</script>