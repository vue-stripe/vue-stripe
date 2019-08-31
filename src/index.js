import VueStripeCheckout from './Checkout.vue';
import VueStripeElements from './Elements.vue';

const Plugin = {
  install (Vue, opts) {
    if (!opts || !opts.publishableKey) {
      console.warn('Vue Stripe Checkout Error: Publishable key is required.');
      return;
    }

    if (window.Stripe) {
      Vue.prototype.$stripe = Stripe(opts && opts.publishableKey);
    } else {
      document.querySelector('#stripe-js').addEventListener('load', () => {
        Vue.prototype.$stripe = Stripe(opts && opts.publishableKey);
      });
    }
    
    Vue.component('vue-stripe-checkout', VueStripeCheckout);
    Vue.component('vue-stripe-elements', VueStripeElements);
  }
};

export { VueStripeCheckout, VueStripeElements };
export default Plugin;
