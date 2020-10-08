export default {
  install (Vue, opts) {
    Vue.mixin({
      computed: {
        $vueStripePublishableKey () {
          return opts.publishableKey;
        },
      },
    });
  },
};
