<template>
<div id="vue-stripe-payment-element-mount-point">Payment Element Mount Point</div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, onMounted } from 'vue';
import {
  STRIPE_PARTNER_DETAILS,
  PAYMENT_ELEMENT_TYPE,
} from '../constants';

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
    //
    elementsOptions: {
      type: Object,
      default: () => ({}),
      validator: (value) => {
        // if (!value?.)
        return true;
      },
    },
  },
  setup (props) {
    const stripe = ref(null);
    const elements = ref(null);
    const paymentElement = ref(null);
    if (props?.disableAdvancedFraudDetection) loadStripe.setLoadParameters({ advancedFraudSignals: false });

    onMounted(async () => {
      const pk = props?.stripeOptions?.pk;
      stripe.value = await loadStripe(pk, props?.stripeOptions);
      console.warn(stripe.value);
      stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
      elements.value = stripe.value.elements(props?.elementsOptions);
      paymentElement.value = elements.value.create(PAYMENT_ELEMENT_TYPE);
    });
  },
};
</script>
