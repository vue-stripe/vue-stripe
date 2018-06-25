(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueStripeCheckout = factory());
}(this, (function () { 'use strict';

function addScript() {
  const script = document.createElement('script');
  script.src = 'https://checkout.stripe.com/checkout.js';
  script.id = 'stripe_checkout';
  document.getElementsByTagName('head')[0].appendChild(script);
}

const VueStripeCheckout = {
  install(Vue, options) {
    if(!options) {
      console.warn('Shut up and provide the options! (config options is required in Vue.use(VueStripeCheckout, options))');
      return;
    }
    window.addEventListener('load', () => {
      Vue.prototype.$checkout = {
        open: (opts) => {
          addScript();
          
          // opts.closed = () => {
          //   removeScript();
          // }

          console.warn('Downloading StripeCheckout...');

          const configStripe = handler => {
            if(!window.StripeCheckout) return;
            window.StripeCheckout.configure(options).open(opts);
            console.warn('StripeCheckout configured!');
            if(handler)
              clearTimeout(handler);
          };
          
          if(window.StripeCheckout) 
            return configStripe(); 

          const handler = setInterval(() => configStripe(handler), 50);
        }
      };
    });
  }
};

return VueStripeCheckout;

})));
