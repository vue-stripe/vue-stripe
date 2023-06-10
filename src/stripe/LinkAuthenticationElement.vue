<template>
  <div id="link-authentication-mount-point"></div>

  <slot name="link-authentication-errors">
    <div id="link-authentication-errors" role="alert" />
  </slot>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, onMounted } from 'vue';
import { STRIPE_PARTNER_DETAILS, LINK_AUTHENTICATION_ELEMENT_TYPE } from '../constants';
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
      elements.value = stripe.value.elements(props.elementOptions);
      linkAuthElement.value = elements.value.create(
        LINK_AUTHENTICATION_ELEMENT_TYPE,
      );
      linkAuthElement.value.mount('#link-authentication-mount-point');

      // Events
      linkAuthElement.value.on('change', (event) => {
        const displayError = document.getElementById(
          'link-authentication-errors',
        );

        if (event?.error) {
          displayError.textContent = event?.error?.message;
        } else {
          displayError.textContent = '';
        }

        emit('element-change', event);
      });

      linkAuthElement.value.on('ready', (event) => {
        emit('element-ready', event);
      });

      linkAuthElement.value.on('focus', (event) => {
        emit('element-focus', event);
      });

      linkAuthElement.value.on('blur', (event) => {
        emit('element-blur', event);
      });

      linkAuthElement.value.on('escape', (event) => {
        emit('element-escape', event);
      });
    }

    onMounted(async () => {
      init();
    });

    // Methods
    function blur () {
      linkAuthElement.value.blur();
    }

    function clear () {
      linkAuthElement.value.clear();
    }

    function destroy () {
      linkAuthElement.value.destroy();
    }

    function focus () {
      linkAuthElement.value.focus();
    }

    function unmount () {
      linkAuthElement.value.unmount();
    }

    function getElement () {
      elements.value.getElement(LINK_AUTHENTICATION_ELEMENT_TYPE);
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
