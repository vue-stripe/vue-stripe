<template>
  <!-- Mount point for the address element -->
  <div id="address-element-mount-point"></div>

  <!-- Slot for displaying address element errors -->
  <slot name="address-element-errors">
    <div id="address-element-errors" role="alert" />
  </slot>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { ref, onMounted } from 'vue';
import { STRIPE_PARTNER_DETAILS, ADDRESS_ELEMENT_TYPE } from '../../constants';

export default {
  name: 'AddressElement',
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
      // Validator to ensure the required 'mode' property is present in elementOptions
      validator (value) {
        return value.mode;
      },
    },
    // Options specific to the address element (optional)
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
    const stripeInstance = ref(null);
    const elementsInstance = ref(null);
    const addressElementInstance = ref(null);

    // On component mount, load Stripe, initialize elements, and set up event listeners
    onMounted(async () => {
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

      // Create the address element and store the instance in addressElementInstance
      addressElementInstance.value = elementsInstance.value.create(
        ADDRESS_ELEMENT_TYPE,
        props.addressElementOptions,
      );

      // Mount the address element to the specified mount point
      addressElementInstance.value.mount('#address-element-mount-point');

      // Set up event listeners for the address element
      addressElementInstance.value.on('change', (event) => {
        // Update the error display based on the event
        const displayError = document.getElementById('address-element-errors');
        displayError.textContent = event?.error?.message || '';

        // Emit the 'elementChange' event with the event data
        emit('elementChange', event);
      });

      addressElementInstance.value.on('ready', () => {
        // Emit the 'elementReady' event when the element is ready
        emit('elementReady');
      });

      addressElementInstance.value.on('blur', () => {
        // Emit the 'elementBlur' event when the element loses focus
        emit('elementBlur');
      });

      addressElementInstance.value.on('focus', () => {
        // Emit the 'elementFocus' event when the element gains focus
        emit('elementFocus');
      });

      addressElementInstance.value.on('escape', () => {
        // Emit the 'elementEscape' event when the escape key is pressed while the element is in focus
        emit('elementEscape');
      });
    });

    // Methods to interact with the address element

    // Blurs the address element
    const blurAddressElement = () => {
      addressElementInstance.value.blur();
    };

    // Clears the values of the address element
    const clearAddressElement = () => {
      addressElementInstance.value.clear();
    };

    // Destroys the address element
    const destroyAddressElement = () => {
      addressElementInstance.value.destroy();
    };

    // Focuses the address element
    const focusAddressElement = () => {
      console.warn(
        'This method will currently not work on iOS 13+ due to a system limitation.',
      );
      addressElementInstance.value.focus();
    };

    // Unmounts the address element
    const unmountAddressElement = () => {
      addressElementInstance.value.unmount();
    };

    // Retrieves the current address element
    const getAddressElement = () => {
      return elementsInstance.value.getElement(ADDRESS_ELEMENT_TYPE);
    };

    // Updates the address element
    const updateAddressElement = (options) => {
      addressElementInstance.value.update(options);
    };

    // Retrieves the value of the address element
    const getAddressElementValue = () => {
      return addressElementInstance.value.getValue();
    };

    // Return the public methods and values
    return {
      blurAddressElement,
      clearAddressElement,
      destroyAddressElement,
      focusAddressElement,
      unmountAddressElement,
      getAddressElement,
      getAddressElementValue,
      updateAddressElement,
    };
  },
};
</script>
