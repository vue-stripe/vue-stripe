<template>
  <div id="link-authentication-mount-point"></div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, onMounted } from 'vue';
import {
  STRIPE_PARTNER_DETAILS,
  LINK_AUTHENTICATION_ELEMENT_TYPE,
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
    disableAdvancedFraudDetection: {
      type: Boolean,
      default: false,
    },
    elementsOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  setup (props, { emit }) {
    const stripe = ref(null);
    const elements = ref(null);
    const linkAuthElement = ref(null);

    async function init () {
      if (props.disableAdvancedFraudDetection) {
        loadStripe.setLoadParameters({ advancedFraudSignals: false });
      }

      const stripeOptions = {
        apiVersion: props.apiVersion,
        locale: props.locale,
        stripeAccount: props.stripeAccount,
      };

      if (props.disableAdvancedFraudDetection) {
        stripeOptions.advancedFraudSignals = false;
      }

      stripe.value = await loadStripe(props.pk, stripeOptions);
      stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
      elements.value = stripe.value.elements(props.elementsOptions);
      linkAuthElement.value = elements.value.create(
        LINK_AUTHENTICATION_ELEMENT_TYPE,
      );
      linkAuthElement.value.mount('#link-authentication-mount-point');
    }

    onMounted(async () => {
      init();
    });
  },
};
</script>
