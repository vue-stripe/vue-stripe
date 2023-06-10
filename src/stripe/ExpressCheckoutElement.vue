<template>
  <div id="express-checkout-element-mount-point"></div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, onMounted } from 'vue';
import {
  STRIPE_PARTNER_DETAILS,
  EXPRESS_CHECKOUT_ELEMENT_TYPE,
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
    elementOptions: {
      type: Object,
      default: () => ({}),
    },
    expressCheckoutOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  setup (props, { emit }) {
    const stripe = ref(null);
    const elements = ref(null);
    const expressCheckoutElement = ref(null);

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
      elements.value = stripe.value.elements(props.elementOptions);
      expressCheckoutElement.value = elements.value.create(
        EXPRESS_CHECKOUT_ELEMENT_TYPE,
        props.expressCheckoutOptions,
      );
      expressCheckoutElement.value.mount('#express-checkout-element-mount-point');

      // Events
      expressCheckoutElement.value.on('click', (event) => {
        // ? Should we add the stripe confirm payment method here?
        emit('element-click', event);
      });
      expressCheckoutElement.value.on('ready', (event) => {
        emit('element-ready', event);
      });

      expressCheckoutElement.value.on('focus', (event) => {
        emit('element-focus', event);
      });

      expressCheckoutElement.value.on('blur', (event) => {
        emit('element-blur', event);
      });

      expressCheckoutElement.value.on('escape', (event) => {
        emit('element-escape', event);
      });
    }

    onMounted(async () => {
      init();
    });

    // Methods
    function blur () {
      expressCheckoutElement.value.blur();
    }

    function clear () {
      expressCheckoutElement.value.clear();
    }

    function destroy () {
      expressCheckoutElement.value.destroy();
    }

    function focus () {
      expressCheckoutElement.value.focus();
    }

    function unmount () {
      expressCheckoutElement.value.unmount();
    }

    function getElement () {
      elements.value.getElement(EXPRESS_CHECKOUT_ELEMENT_TYPE);
    }

    return {
      blur,
      clear,
      destroy,
      focus,
      unmount,
      getElement,
    };
  },
};
</script>
