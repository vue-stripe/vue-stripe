import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PARTNER_DETAILS } from '../constants';

export const useVueStripe = (pk, options) => {
  let stripe = null;
  if (options?.disableAdvancedFraudDetection) loadStripe.setLoadParameters({ advancedFraudSignals: false });
  const stripeOptions = {
    stripeAccount: options?.stripeAccount,
    apiVersion: options?.apiVersion,
    locale: options?.locale,
  };

  async function init () {
    stripe = await loadStripe(pk, stripeOptions);
    stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
  }

  async function redirectToCheckout (options) {
    try {
      if (options?.sessionId) {
        stripe.redirectToCheckout({
          sessionId: options.sessionId,
        });
        return;
      }

      if (options?.lineItems?.length && !options?.mode) {
        throw new Error('Error: Property \'mode\' is required when using \'lineItems\'. See https://stripe.com/docs/js/checkout/redirect_to_checkout#stripe_checkout_redirect_to_checkout-options-mode');
      }

      if (!options?.successUrl || !options?.cancelUrl) {
        throw new Error('Error: successUrl and cencelUrl is required.');
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

      stripe.redirectToCheckout(checkoutOptions);
    } catch (e) {
      console.error(e);
    }
  }

  init();

  return {
    stripe,
    redirectToCheckout,
  };
};
