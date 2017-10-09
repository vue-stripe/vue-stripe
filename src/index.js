var script = document.createElement('script');
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
}

export default VueStripeCheckout;
