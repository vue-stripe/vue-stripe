<template>
  <div id="address-element-mount-point"></div>

  <slot name="address-element-errors">
    <div id="address-element-errors" role="alert" />
  </slot>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, onMounted } from 'vue';
import { STRIPE_PARTNER_DETAILS, ADDRESS_ELEMENT_TYPE } from '../constants';
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
    addressElementOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: [
    'elementChange',
    'elementReady',
    'elementFocus',
    'elementBlur',
    'elementEscape',
  ],
  setup (props, { emit }) {
    const stripe = ref(null);
    const elements = ref(null);
    const addressElement = ref(null);

    onMounted(async () => {
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
      addressElement.value = elements.value.create(
        ADDRESS_ELEMENT_TYPE,
        props.addressElementOptions,
      );

      addressElement.value.mount('#address-element-mount-point');

      addressElement.value.on('change', (event) => {
        const displayError = document.getElementById('address-element-errors');

        if (event?.error) {
          displayError.textContent = event?.error?.message;
        } else {
          displayError.textContent = '';
        }
        emit('elementChange', event);
      });

      addressElement.value.on('ready', () => {
        emit('elementReady');
      });

      addressElement.value.on('blur', () => {
        emit('elementBlur');
      });

      addressElement.value.on('focus', () => {
        emit('elementFocus');
      });

      addressElement.value.on('escape', () => {
        emit('elementEscape');
      });
    });

    // Methods

    /**
     * Blurs the [Element](https://stripe.com/docs/js/element)
     */
    const blur = () => {
      addressElement.value.blur();
    };

    /**
     * Clears the values of the [Element](https://stripe.com/docs/js/element)
     */
    const clear = () => {
      addressElement.value.clear();
    };

    /**
     * Destroys the [Element](https://stripe.com/docs/js/element).
     * A destroyed `Element` cannot be re-activated or re-mounted to the DOM
     */
    const destroy = () => {
      addressElement.value.destroy();
    };

    /**
     * Focuses the [Element](https://stripe.com/docs/js/element)
     * This method will currently not work on iOS 13+ due to a system limitation.
     */
    const focus = () => {
      console.warn(
        'This method will currently not work on iOS 13+ due to a system limitation.',
      );
      addressElement.value.focus();
    };

    /**
     * Unmounts the [Element](https://stripe.com/docs/js/element)
     */
    const unmount = () => {
      addressElement.value.unmount();
    };

    /**
     * Retrieves the current [Element](https://stripe.com/docs/js/element)
     *
     * @returns [Payment Element](https://stripe.com/docs/js/element/payment_element) Object
     */
    const getElement = () => {
      this.elements.getElement(ADDRESS_ELEMENT_TYPE);
    };

    /**
     * Updates the [Element](https://stripe.com/docs/js/element)
     *
     * See full docs here: https://stripe.com/docs/js/elements_object/update_payment_element
     */
    const update = (options) => {
      addressElement.value.update(options);
    };

    const getValue = () => {
      addressElement.value.getValue();
    };

    return {
      blur,
      clear,
      destroy,
      focus,
      unmount,
      getElement,
      getValue,
      update,
    };
  },
};
</script>
