import { STRIPE_CHECKOUT_URL } from './constants';

export const loadStripeCheckout = (pk, version = 'v3', callback) => {
  let e = document.createElement('script');
  e.src = `${STRIPE_CHECKOUT_URL}/${version}`;
  e.type='text/javascript';
  document.getElementsByTagName('head')[0].appendChild(e);
  e.addEventListener('load', callback);
};