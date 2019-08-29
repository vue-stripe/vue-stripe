'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
      required: true,
    },
    /**
     * @type {SKUItem} - Stripe's SKU item.
     */
    items: {
      type: Array
    },
    successUrl: {
      type: String,
      default: window.location.href
    },
    cancelUrl: {
      type: String,
      default: window.location.href
    },
    submitType: {
      type: String,
      default: 'auto',
      validator (value) {
        let supportedValues = ['auto', 'book', 'donate', 'pay'];
        return supportedValues.includes(value);
      }
    },
    billingAddressCollection: {
      type: String,
      default: 'auto',
      validator (value) {
        let supportedValues = ['required', 'auto'];
        return supportedValues.includes(value);
      }
    },
    clientReferenceId: {
      type: String,
    },
    customerEmail: {
      type: String
    },
    sessionId: {
      type: String
    },
    locale: {
      type: String,
      default: 'auto',
      validator (value) {
        let supportedValues = ['auto', 'da', 'de', 'en', 'es', 'fi', 'fr', 'it', 'ja', 'nb', 'nl', 'pl', 'pt', 'sv', 'zh'];
        return supportedValues.includes(value);
      }
    }
  },
  created () {
    const script = document.createElement('script');
    script.id = '_stripe-redirect-to-checkout';
    script.src = 'https://js.stripe.com/v3';
    document.querySelector('head').append(script);
  },
  computed: {
    key () {
      return this.publishableKey;
    },
    stripe () {
      return Stripe(this.key);
    },
    stripeElements () {
      return this.stripe.elements();
    }
  },
  methods: {
    redirectToCheckout () {
      try {
        this.$emit('loading', true);
        this.stripe.redirectToCheckout({
          billingAddressCollection: this.billingAddressCollection,
          cancelUrl: this.cancelUrl,
          clientReferenceId: this.clientReferenceId,
          customerEmail: this.customerEmail,
          items: this.items,
          locale: this.locale,
          sessionId: this.sessionId,
          submitType: this.submitType ,
          successUrl: this.successUrl,
        });
      } catch (e) {
        this.$emit('error', e);
      } finally {
        this.$emit('loading', false);
      }
    },
    /** TODO: Create stripe elements
     * @param {Object} cardElement
     * @param {Object} data - Refer to https://stripe.com/docs/api/payment_methods/create
     */
    async createPaymentMethod (cardElement, data) {
      try {
        this.$emit('loading', true);
        const { paymentMethod } = await this.stripe.createPaymentMethod(
          'card',
          cardElement,
          data
        );
        this.$emit('paymentMethod', paymentMethod);
      } catch (e) {
        this.$emit('error', e);
      } finally {
        this.$emit('loading', false);
      }
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
/* server only */
, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  var options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  var hook;

  if (moduleIdentifier) {
    // server build
    hook = function hook(context) {
      // 2.3 injection
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function () {
      style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      var originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}

var normalizeComponent_1 = normalizeComponent;

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", [_vm._t("checkout-button")], 2)
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var VueStripeCheckout = normalizeComponent_1(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    undefined,
    undefined
  );

const Plugin = {
  install (Vue, options) {
    Vue.component('vue-stripe-checkout', VueStripeCheckout);
  }
};

exports.VueStripeCheckout = VueStripeCheckout;
exports.default = Plugin;
