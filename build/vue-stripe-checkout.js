(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueStripeCheckout = factory());
}(this, (function () { 'use strict';

const script = document.createElement('script');
script.src = 'https://checkout.stripe.com/checkout.js';
document.getElementsByTagName('head')[0].appendChild(script);

const VueStripeCheckout = {
  install(Vue, options) {
    if(!options) {
      console.warn('Shut up and provide the options! (config options is required in Vue.use(VueStripeCheckout, options))');
      return;
    }
    window.addEventListener('load', () => {
      Vue.prototype.$checkout = StripeCheckout.configure(options);
    });
  }
};

return VueStripeCheckout;

})));
