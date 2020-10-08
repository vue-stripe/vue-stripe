<template>
  <div id="card-number-mount-point"></div>
</template>

<script>
import StripeHelper from './stripe-helper';
export default {
  async mounted () {
    const { stripe, stripeElements } = await StripeHelper({
      publishableKey: this.$vueStripePublishableKey
    });
    stripeElements.create('cardNumber').mount('#card-number-mount-point');
  }
};
</script>
