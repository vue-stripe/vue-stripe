import { STRIPE_JS_SDK_URL } from './constants';

export const loadStripeSdk = (pk, version = 'v3', callback) => {
  if (window.Stripe) {
    callback();
    return;
  }
  let e = document.createElement('script');
  e.src = `${STRIPE_JS_SDK_URL}/${version}`;
  e.type='text/javascript';
  document.getElementsByTagName('head')[0].appendChild(e);
  e.addEventListener('load', callback);
};
