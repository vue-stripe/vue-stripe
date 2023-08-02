<template>
  <div>
    <div id="vue-stripe-payment-element-mount-point" />
    <slot name="vue-stripe-payment-element-errors">
      <div id="vue-stripe-payment-element-errors" role="alert" />
    </slot>
  </div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, watch } from 'vue';
import { hasElementIntent } from '../../utils';
import { STRIPE_PARTNER_DETAILS, PAYMENT_ELEMENT_TYPE } from '../../constants';

export default {
  name: 'PaymentElement',
  props: {
    pk: {
      type: String,
      required: true,
    },
    stripeAccount: String,
    apiVersion: String,
    locale: String,
    disableAdvancedFraudDetection: {
      type: Boolean,
      default: false,
    },
    // Element options
    elementOptions: {
      type: Object,
      default: () => ({}),
      validator: (value) => {
        return value.clientSecret || hasElementIntent(value);
      },
    },
    paymentElementOptions: {
      type: Object,
      default: () => ({}),
    },
    confirmParams: {
      type: Object,
      default: () => ({}),
      validator: (value) => {
        return value.return_url !== null;
      },
    },
  },
  emits: [
    'elementChange',
    'elementReady',
    'elementFocus',
    'elementBlur',
    'elementEscape',
    'loading',
    'error',
  ],
  setup (props, { emit }) {
    const stripe = ref(null);
    const elements = ref(null);
    const paymentElement = ref(null);
    const displayError = ref('');

    if (props.disableAdvancedFraudDetection) {
      loadStripe.setLoadParameters({ advancedFraudSignals: false });
    }

    watch(props, () => init());

    async function init () {
      const pk = props.pk;
      const stripeOptions = {
        stripeAccount: props.stripeAccount,
        apiVersion: props.apiVersion,
        locale: props.locale,
        advancedFraudSignals: !props.disableAdvancedFraudDetection,
      };

      stripe.value = await loadStripe(pk, stripeOptions);
      stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
      elements.value = stripe.value.elements(props?.elementOptions);
      paymentElement.value = elements.value.create(
        PAYMENT_ELEMENT_TYPE,
        props?.paymentElementOptions,
      );
      paymentElement.value.mount('#vue-stripe-payment-element-mount-point');

      // Handle emits
      paymentElement.value.on('change', handleElementChange);
      paymentElement.value.on('ready', handleElementReady);
      paymentElement.value.on('focus', handleElementFocus);
      paymentElement.value.on('blur', handleElementBlur);
      paymentElement.value.on('escape', handleElementEscape);
    }

    function handleElementChange (event) {
      displayError.value = event?.error?.message || '';
      emit('elementChange', event);
    }

    function handleElementReady (event) {
      emit('elementReady', event);
    }

    function handleElementFocus (event) {
      emit('elementFocus', event);
    }

    function handleElementBlur (event) {
      emit('elementBlur', event);
    }

    function handleElementEscape (event) {
      emit('elementEscape', event);
    }

    // Watch for props change
    // watchEffect(async () => {
    //   try {
    //     if (stripe.value) {
    //       stripe.value = null;
    //       elements.value = null;
    //       paymentElement.value.unmount();
    //       await initStripe();
    //     }
    //   } catch (error) {
    //     displayError.value = 'Error initializing Stripe.';
    //     emit('error', error);
    //   }
    // });

    // Methods
    const submit = () => {
      try {
        emit('loading', true);
        const { error } = stripe.value.confirmPayment({
          elements: elements.value,
          confirmParams: props?.confirmParams,
        });

        if (error) {
          console.error(error);
          emit('error', error);
        }
      } catch (error) {
        emit('error', error);
      }
    };

    const blur = () => {
      paymentElement.value.blur();
    };

    const clear = () => {
      paymentElement.value.clear();
    };

    const destroy = () => {
      paymentElement.value.destroy();
    };

    const focus = () => {
      console.warn(
        'This method will currently not work on iOS 13+ due to a system limitation.',
      );
      paymentElement.value.focus();
    };

    const unmount = () => {
      paymentElement.value.unmount();
    };

    const getElement = () => {
      return elements.value.getElement(PAYMENT_ELEMENT_TYPE);
    };

    const update = (options) => {
      paymentElement.value.update(options);
    };

    return {
      displayError,
      submit,
      blur,
      clear,
      destroy,
      focus,
      unmount,
      getElement,
      update,
    };
  },
};
</script>
