import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PARTNER_DETAILS } from '../constants';
import { onMounted, ref } from 'vue';

export default (pk, options) => {
  // Define a reactive reference for the Stripe instance
  const stripe = ref(null);

  // Check and set advancedFraudSignals if requested
  if (options?.disableAdvancedFraudDetection) {
    loadStripe.setLoadParameters({ advancedFraudSignals: false });
  }

  // Prepare the options to be passed to the Stripe instance
  const stripeOptions = {
    stripeAccount: options?.stripeAccount,
    apiVersion: options?.apiVersion,
    locale: options?.locale,
  };

  // Load the Stripe instance when the component is mounted
  onMounted(async () => {
    try {
      stripe.value = await loadStripe(pk, stripeOptions);
      // Register app info with Stripe
      stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
    } catch (error) {
      console.error('Error loading Stripe:', error);
      // Handle any loading errors here, e.g., show a user-friendly error message
    }
  });

  // Function to redirect to Stripe Checkout
  async function redirectToCheckout (options) {
    try {
      // Check if the Stripe instance is available
      if (!stripe.value) {
        throw new Error('Error: Stripe instance is not initiated!');
      }

      // Handle redirection for existing session
      if (options?.sessionId) {
        stripe.value.redirectToCheckout({
          sessionId: options.sessionId,
        });
        return;
      }

      // Validate and build the options for redirection
      if (options?.lineItems?.length && !options?.mode) {
        throw new Error(
          'Error: Property \'mode\' is required when using \'lineItems\'. See https://stripe.com/docs/js/checkout/redirect_to_checkout#stripe_checkout_redirect_to_checkout-options-mode',
        );
      }

      if (!options?.successUrl || !options?.cancelUrl) {
        throw new Error('Error: successUrl and cancelUrl are required.');
      }

      const checkoutOptions = {
        billingAddressCollection: options?.billingAddressCollection,
        cancelUrl: options.cancelUrl,
        clientReferenceId: options?.clientReferenceId,
        customerEmail: options?.customerEmail,
        items: options?.items,
        lineItems: options?.lineItems,
        locale: options?.locale,
        mode: options?.mode,
        shippingAddressCollection: options?.shippingAddressCollection,
        submitType: options?.submitType,
        successUrl: options.successUrl,
      };

      // Redirect to Stripe Checkout with the built options
      stripe.value.redirectToCheckout(checkoutOptions);
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      // Handle any redirection errors here, e.g., show a user-friendly error message
    }
  }

  // Return the reactive Stripe instance and the redirection function
  return {
    stripe,
    redirectToCheckout,
  };
};
