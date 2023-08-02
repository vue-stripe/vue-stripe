import { onMounted } from 'vue';
import { PAYMENT_ELEMENT_TYPE } from '../constants';

/**
 * Initialize and create a payment element using Stripe Elements.
 * @param {StripeElements} elements - The Stripe Elements instance.
 * @param {Object} options - The configuration options for the payment element.
 * @param {string} options.clientSecret - The client secret required for payment element creation.
 * @param {string} options.otherOptions - Other options specific to the payment element.
 * @returns {void}
 */
export default (elements, options) => {
  // Call the elements.create method when the component is mounted
  onMounted(() => {
    // Create the payment element using the provided elements and options
    // PAYMENT_ELEMENT_TYPE is the type of element to create (e.g., 'card', 'iban', etc.)
    // options is an object containing the configuration for the payment element
    elements.create(PAYMENT_ELEMENT_TYPE, options);
  });
};
