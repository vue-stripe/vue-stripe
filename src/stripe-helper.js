import { loadStripeSdk } from './load-stripe-sdk';
export default (opts) => {
  return new Promise((resolve, reject) => {
    loadStripeSdk(opts.version, () => {
      const options = {
        stripeAccount: opts.stripeAccount,
        apiVersion: opts.apiVersion || 'v3',
        locale: opts.locale,
      };
      const stripe = window.Stripe(opts.publishableKey, options);
      resolve(Object.freeze({
        stripe,
        stripeElements: stripe.elements(),
      }));
    });
  });
};
