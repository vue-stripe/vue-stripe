import { ref } from 'vue-demi';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PARTNER_DETAILS } from '../constants';


/**
 * @typedef {Object} StripeOptions
 * @property {string} pk - The publishable key
 * @property {Object} options - Additional options
 * @returns {Object} stripe - The stripe instance
 * @returns {Object} elements - The elements instance
 * @returns {Function} initializeElements - Initialize the elements instance
 * @example
 * const { stripe, elements, initializeElements } = useStripe('pk_test_12345', {});
 **/
export function useStripe (pk, options) {
  const stripe = ref(null);
  const elements = ref(null);

  async function init () {
    if (options?.disableAdvancedFraudDetection) {
      loadStripe.setLoadParameters({ advancedFraudSignals: false });
    }

    const stripeOptions = {
      stripeAccount: options?.stripeAccount,
      apiVersion: options?.apiVersion,
      locale: options?.locale,
    };

    stripe.value = await loadStripe(pk, stripeOptions);
    stripe.value?.registerAppInfo(STRIPE_PARTNER_DETAILS);
  }

  /**
   * 
   * @param {string} clientSecret - The client secret
   * @param {Object} elementsOptions - Additional options
   */
  async function initializeElements (clientSecret, elementsOptions) {
    if (!stripe.value) {
      await init(); // Wait until stripe is loaded
    }
    elements.value = stripe.value?.elements({
      ...elementsOptions,
      clientSecret,
    });
  }

  // Initialize immediately, but without calling initializeElements prematurely
  init();

  return {
    stripe,
    elements,
    initializeElements,
  };
}
