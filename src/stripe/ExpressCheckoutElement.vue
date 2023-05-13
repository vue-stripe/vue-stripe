<template>
  <div id="express-checkout-element-mount-point"></div>

  <slot name="express-checkout-element-errors">
    <div id="express-checkout-element-errors" role="alert" />
  </slot>
</template>

<script>
import { onMounted } from 'vue';
export default {
  props: {
    pk: {
      type: String,
      default: undefined,
      required: true,
    },
    stripeAccount: {
      type: String,
      default: undefined,
    },
    apiVersion: {
      type: String,
      default: undefined,
    },
    locale: {
      type: String,
      default: undefined,
    },
    disableAdvancedFraudDetection: {
      type: Boolean,
      default: false,
    },
    elementsOptions: {
      type: Object,
      default: () => ({}),
    },
    expressCheckoutOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  setup () {
    function init () {
      // TODO: Do init
    }

    onMounted(async () => {
      init();
    });
  },
};
</script>
