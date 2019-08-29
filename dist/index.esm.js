import __vue_normalize__ from 'vue-runtime-helpers/dist/normalize-component.js';

//
//
//
//
//
//

/**
 * @typedef SKUItem
 */
var script = {
  props: {
    /**
     * @type {string} - Stripe's publishable key, from Stripe dashboard.
     */
    publishableKey: {
      type: String,
      required: true
    },

    /**
     * @type {SKUItem} - Stripe's SKU item.
     */
    items: {
      type: Array
    },
    successUrl: {
      type: String,
      "default": window.location.href
    },
    cancelUrl: {
      type: String,
      "default": window.location.href
    },
    submitType: {
      type: String
    }
  },
  mounted: function mounted() {
    var script = document.createElement('script');
    script.id = '_stripe-redirect-to-checkout';
    script.src = 'https://js.stripe.com/v3';
    document.querySelector('head').append(script);
  },
  computed: {
    key: function key() {
      return this.publishableKey;
    },
    stripe: function stripe() {
      return Stripe(this.key);
    }
  },
  methods: {
    redirectToCheckout: function redirectToCheckout() {
      try {
        this.$emit('loading', true);
        this.stripe.redirectToCheckout({
          items: this.items,
          successUrl: this.successUrl,
          cancelUrl: this.cancelUrl,
          submitType: this.submitType
        });
      } catch (e) {
        this.$emit('error', e);
      } finally {
        this.$emit('loading', false);
      }
    }
  }
};

/* script */
var __vue_script__ = script;
/* template */

var __vue_render__ = function __vue_render__() {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', [_vm._t("checkout-button")], 2);
};

var __vue_staticRenderFns__ = [];
/* style */

var __vue_inject_styles__ = undefined;
/* scoped */

var __vue_scope_id__ = undefined;
/* module identifier */

var __vue_module_identifier__ = undefined;
/* functional template */

var __vue_is_functional_template__ = false;
/* style inject */

/* style inject SSR */

var VueStripeCheckout = __vue_normalize__({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, undefined, undefined);

var Plugin = {
  install: function install(Vue, options) {
    Vue.component('vue-stripe-checkout', VueStripeCheckout);
  }
};

export default Plugin;
export { VueStripeCheckout };
