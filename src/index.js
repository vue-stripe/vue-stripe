import VueStripeCheckout from './Checkout.vue';

const Plugin = {
  install (Vue, options) {
    Vue.component('vue-stripe-checkout', VueStripeCheckout);
  }
}

export default Plugin;
export { VueStripeCheckout };
