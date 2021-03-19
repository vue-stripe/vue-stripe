import { STRIPE_JS_SDK_URL } from './constants';

export const loadStripeSdk = ({ version = 'v3', disableAdvancedFraudDetection, enableCrossOrigin }, callback) => {
  if (window.Stripe) {
    callback();
    return;
  }
  let url = `${STRIPE_JS_SDK_URL}/${version}`;
  if (disableAdvancedFraudDetection) url += '?advancedFraudSignals=false';
  const e = document.createElement('script');
  e.src = url;
  e.type = 'text/javascript';
  if (enableCrossOrigin) e.crossOrigin = true;
  document.getElementsByTagName('head')[0].appendChild(e);
  e.addEventListener('load', callback);
};
