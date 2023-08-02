<template>
  <!-- Mount point for the express checkout element -->
  <div id="express-checkout-element-mount-point"></div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, onMounted } from 'vue';
import {
  STRIPE_PARTNER_DETAILS,
  EXPRESS_CHECKOUT_ELEMENT_TYPE,
} from '../../constants';

export default {
  name: 'ExpressCheckoutElement',
  props: {
    // Stripe publishable key (required)
    pk: {
      type: String,
      required: true,
    },
    // Stripe account ID (optional)
    stripeAccount: {
      type: String,
      default: undefined,
    },
    // Stripe API version (optional)
    apiVersion: {
      type: String,
      default: undefined,
    },
    // Locale for the Stripe elements (optional)
    locale: {
      type: String,
      default: undefined,
    },
    // Option to disable advanced fraud detection (optional)
    disableAdvancedFraudDetection: {
      type: Boolean,
      default: false,
    },
    // Options for the main element (e.g., card element) (optional)
    elementOptions: {
      type: Object,
      default: () => ({}),
    },
    // Options specific to the express checkout element (optional)
    expressCheckoutOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  setup (props, { emit }) {
    const stripeInstance = ref(null);
    const elementsInstance = ref(null);
    const expressCheckoutElementInstance = ref(null);

    // Initialize Stripe and Express Checkout element
    async function init () {
      try {
        // Optionally disable advanced fraud detection if specified
        if (props.disableAdvancedFraudDetection) {
          loadStripe.setLoadParameters({ advancedFraudSignals: false });
        }

        // Set up options for the Stripe instance
        const stripeOptions = {
          apiVersion: props.apiVersion,
          locale: props.locale,
          stripeAccount: props.stripeAccount,
        };

        // Optionally disable advanced fraud detection in the stripeOptions object
        if (props.disableAdvancedFraudDetection) {
          stripeOptions.advancedFraudSignals = false;
        }

        // Load Stripe and store the instance in stripeInstance
        stripeInstance.value = await loadStripe(props.pk, stripeOptions);

        // Register the app with the Stripe partner details
        stripeInstance.value.registerAppInfo(STRIPE_PARTNER_DETAILS);

        // Initialize Stripe elements and store the instance in elementsInstance
        elementsInstance.value = stripeInstance.value.elements(
          props.elementOptions,
        );

        // Create the express checkout element and store the instance in expressCheckoutElementInstance
        expressCheckoutElementInstance.value = elementsInstance.value.create(
          EXPRESS_CHECKOUT_ELEMENT_TYPE,
          props.expressCheckoutOptions,
        );

        // Mount the express checkout element to the specified mount point
        expressCheckoutElementInstance.value.mount(
          '#express-checkout-element-mount-point',
        );

        // Set up event listeners for the express checkout element
        expressCheckoutElementInstance.value.on('click', (event) => {
          // Emit the 'element-click' event with the event data
          emit('element-click', event);
        });

        expressCheckoutElementInstance.value.on('ready', (event) => {
          // Emit the 'element-ready' event when the element is ready
          emit('element-ready', event);
        });

        expressCheckoutElementInstance.value.on('focus', (event) => {
          // Emit the 'element-focus' event when the element gains focus
          emit('element-focus', event);
        });

        expressCheckoutElementInstance.value.on('blur', (event) => {
          // Emit the 'element-blur' event when the element loses focus
          emit('element-blur', event);
        });

        expressCheckoutElementInstance.value.on('escape', (event) => {
          // Emit the 'element-escape' event when the escape key is pressed while the element is in focus
          emit('element-escape', event);
        });
      } catch (error) {
        // Handle errors and emit an 'element-error' event with the error object
        emit('element-error', error);
      }
    }

    // Initialize Stripe and Express Checkout element on component mount
    onMounted(async () => {
      await init();
    });

    // Methods to interact with the express checkout element

    // Blurs the express checkout element
    function blur () {
      expressCheckoutElementInstance.value.blur();
    }

    // Clears the values of the express checkout element
    function clear () {
      expressCheckoutElementInstance.value.clear();
    }

    // Destroys the express checkout element
    function destroy () {
      expressCheckoutElementInstance.value.destroy();
    }

    // Focuses the express checkout element
    function focus () {
      expressCheckoutElementInstance.value.focus();
    }

    // Unmounts the express checkout element
    function unmount () {
      expressCheckoutElementInstance.value.unmount();
    }

    // Retrieves the current express checkout element
    function getElement () {
      return elementsInstance.value.getElement(EXPRESS_CHECKOUT_ELEMENT_TYPE);
    }

    // Return the public methods and values
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
