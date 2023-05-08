<template>
  <div id="vue-stripe-payment-element-mount-point" />
  <slot name="vue-stripe-payment-element-errors">
    <div id="vue-stripe-payment-element-errors" role="alert" />
  </slot>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, onMounted } from 'vue';
import { hasElementIntent } from '../utilities';
import { STRIPE_PARTNER_DETAILS, PAYMENT_ELEMENT_TYPE } from '../constants';

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
    //
    elementsOptions: {
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
  setup (props, { emit }) {
    const stripe = ref(null);
    const elements = ref(null);
    const paymentElement = ref(null);

    if (props?.disableAdvancedFraudDetection) {
      loadStripe.setLoadParameters({ advancedFraudSignals: false });
    }

    onMounted(async () => {
      const pk = props?.pk;
      const stripeOptions = {
        stripeAccount: props.stripeAccount,
        apiVersion: props.apiVersion,
        locale: props.locale,
      };

      stripe.value = await loadStripe(pk, stripeOptions);
      stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
      elements.value = stripe.value.elements(props?.elementsOptions);
      paymentElement.value = elements.value.create(
        PAYMENT_ELEMENT_TYPE,
        props?.paymentElementOptions,
      );
      paymentElement.value.mount('#vue-stripe-payment-element-mount-point');

      // Handle emits
      paymentElement.value.on('change', (event) => {
        const displayError = document.getElementById(
          'vue-stripe-payment-element-errors',
        );

        if (event?.error) {
          displayError.textContent = event?.error?.message;
        } else {
          displayError.textContent = '';
        }

        emit('element-change', event);
      });

      paymentElement.value.on('ready', (event) => {
        emit('element-ready', event);
      });

      paymentElement.value.on('focus', (event) => {
        emit('element-focus', event);
      });

      paymentElement.value.on('blur', (event) => {
        emit('element-blur', event);
      });

      paymentElement.value.on('escape', (event) => {
        emit('element-escape', event);
      });

      paymentElement.value.on('click', (event) => {
        emit('element-click', event);
      });
    });

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

    /**
     * Blurs the [Element](https://stripe.com/docs/js/element)
     */
    const blur = () => {
      paymentElement.value.blur();
    };

    /**
     * Clears the values of the [Element](https://stripe.com/docs/js/element)
     */
    const clear = () => {
      paymentElement.value.clear();
    };

    /**
     * Destroys the [Element](https://stripe.com/docs/js/element).
     * A destroyed `Element` cannot be re-activated or re-mounted to the DOM
     */
    const destroy = () => {
      paymentElement.value.destroy();
    };

    /**
     * Focuses the [Element](https://stripe.com/docs/js/element)
     * This method will currently not work on iOS 13+ due to a system limitation.
     */
    const focus = () => {
      console.warn(
        'This method will currently not work on iOS 13+ due to a system limitation.',
      );
      paymentElement.value.focus();
    };

    /**
     * Unmounts the [Element](https://stripe.com/docs/js/element)
     */
    const unmount = () => {
      paymentElement.value.unmount();
    };

    /**
     * Retrieves the current [Element](https://stripe.com/docs/js/element)
     *
     * @returns [Payment Element](https://stripe.com/docs/js/element/payment_element) Object
     */
    const getElement = () => {
      this.elements.getElement(PAYMENT_ELEMENT_TYPE);
    };

    /**
     * Updates the [Element](https://stripe.com/docs/js/element)
     *
     * See full docs here: https://stripe.com/docs/js/elements_object/update_payment_element
     */
    const update = (options) => {
      paymentElement.value.update(options);
    };

    return {
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
