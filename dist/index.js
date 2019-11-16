'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const SUPPORTED_LANGS = [
  'auto',
  'da',
  'de',
  'en',
  'es',
  'fi',
  'fr',
  'it',
  'ja',
  'nb',
  'nl',
  'pl',
  'pt',
  'sv',
  'zh'
];

const SUPPORTED_SUBMIT_TYPES = [
  'auto', 
  'book', 
  'donate', 
  'pay'
];

const BILLING_ADDRESS_COLLECTION_TYPES = [
  'required', 
  'auto'
];

//
var script = {
  props: {
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
      default: null,
      validator: (value) => SUPPORTED_SUBMIT_TYPES.includes(value)
    },
    billingAddressCollection: {
      type: String,
      default: 'auto',
      validator: (value) => BILLING_ADDRESS_COLLECTION_TYPES.includes(value)
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
      validator: (value) => SUPPORTED_LANGS.includes(value)
    }
  },
  methods: {
    redirectToCheckout () {
      try {
        this.$emit('loading', true);
        let checkoutOptions = {
          billingAddressCollection: this.billingAddressCollection,
          cancelUrl: this.cancelUrl,
          clientReferenceId: this.clientReferenceId,
          customerEmail: this.customerEmail,
          items: this.items,
          locale: this.locale,
          sessionId: this.sessionId,
          successUrl: this.successUrl,
        };

        if (this.submitType) {
          checkoutOptions.submitType = this.submitType;
        }

        this.$stripe.redirectToCheckout(checkoutOptions);
      } catch (e) {
        console.error(e);
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

//
//
//
//
//
//
//
//
//
//
//
//
//
//

var script$1 = {
  data () {
    return {
      loading: false
    }
  },
  mounted () {
    this.card.mount('#card-element');
    this.card.addEventListener('change', ({ error }) => {
      const displayError = document.getElementById('card-errors');
      if (error) {
        displayError.textContent = error.message;
      } else {
        displayError.textContent = '';
      }
    });
    
    this.form.addEventListener('submit', async (event) => {
      try {
        this.$emit('loading', true);
        event.preventDefault();
        const { token, error } = await this.$stripe.createToken({...this.card, amount: 1000});
        if (error) {
          const errorElement = document.getElementById('card-errors');
          errorElement.textContent = error.message;
          this.$emit('error', error);
        } else {
          this.$emit('token', token);
        }
      } catch (e) {
        this.$emit('error', error);
      } finally {
        this.$emit('loading', false);
      }
    });
  },
  computed: {
    style () {
      return {
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      };
    },
    elements () {
      return this.$stripe.elements();
    },
    card () {
      return this.elements.create('card', { style: this.style });
    },
    form () {
      return document.getElementById('payment-form');
    }
  },
  methods: {
    submit () {
      this.$refs.submitButtonRef.click();
    }
  }
};

var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
  return function (id, style) {
    return addStyle(id, style);
  };
}
var HEAD;
var styles = {};

function addStyle(id, css) {
  var group = isOldIE ? css.media || 'default' : id;
  var style = styles[group] || (styles[group] = {
    ids: new Set(),
    styles: []
  });

  if (!style.ids.has(id)) {
    style.ids.add(id);
    var code = css.source;

    if (css.map) {
      // https://developer.chrome.com/devtools/docs/javascript-debugging
      // this makes source maps inside style tags work properly in Chrome
      code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'; // http://stackoverflow.com/a/26603875

      code += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) + ' */';
    }

    if (!style.element) {
      style.element = document.createElement('style');
      style.element.type = 'text/css';
      if (css.media) style.element.setAttribute('media', css.media);

      if (HEAD === undefined) {
        HEAD = document.head || document.getElementsByTagName('head')[0];
      }

      HEAD.appendChild(style.element);
    }

    if ('styleSheet' in style.element) {
      style.styles.push(code);
      style.element.styleSheet.cssText = style.styles.filter(Boolean).join('\n');
    } else {
      var index = style.ids.size - 1;
      var textNode = document.createTextNode(code);
      var nodes = style.element.childNodes;
      if (nodes[index]) style.element.removeChild(nodes[index]);
      if (nodes.length) style.element.insertBefore(textNode, nodes[index]);else style.element.appendChild(textNode);
    }
  }
}

var browser = createInjector;

/* script */
const __vue_script__$1 = script$1;

/* template */
var __vue_render__$1 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", [
    _c(
      "form",
      { attrs: { id: "payment-form" } },
      [
        _vm._t("card-element", [_c("div", { attrs: { id: "card-element" } })]),
        _vm._v(" "),
        _vm._t("card-errors", [
          _c("div", { attrs: { id: "card-errors", role: "alert" } })
        ]),
        _vm._v(" "),
        _c("button", { ref: "submitButtonRef", attrs: { type: "submit" } })
      ],
      2
    )
  ])
};
var __vue_staticRenderFns__$1 = [];
__vue_render__$1._withStripped = true;

  /* style */
  const __vue_inject_styles__$1 = function (inject) {
    if (!inject) return
    inject("data-v-af342020_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n/**\n * The CSS shown here will not be introduced in the Quickstart guide, but shows\n * how you can use CSS to style your Element's container.\n */\n.StripeElement[data-v-af342020] {\n  box-sizing: border-box;\n\n  height: 40px;\n\n  padding: 10px 12px;\n\n  border: 1px solid transparent;\n  border-radius: 4px;\n  background-color: white;\n\n  box-shadow: 0 1px 3px 0 #e6ebf1;\n  -webkit-transition: box-shadow 150ms ease;\n  transition: box-shadow 150ms ease;\n}\n.StripeElement--focus[data-v-af342020] {\n  box-shadow: 0 1px 3px 0 #cfd7df;\n}\n.StripeElement--invalid[data-v-af342020] {\n  border-color: #fa755a;\n}\n.StripeElement--webkit-autofill[data-v-af342020] {\n  background-color: #fefde5 !important;\n}\n", map: {"version":3,"sources":["/Users/helio/PhpstormProjects/vue-stripe-checkout/src/Elements.vue"],"names":[],"mappings":";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AAwFA;;;EAGA;AACA;EACA,sBAAA;;EAEA,YAAA;;EAEA,kBAAA;;EAEA,6BAAA;EACA,kBAAA;EACA,uBAAA;;EAEA,+BAAA;EACA,yCAAA;EACA,iCAAA;AACA;AAEA;EACA,+BAAA;AACA;AAEA;EACA,qBAAA;AACA;AAEA;EACA,oCAAA;AACA","file":"Elements.vue","sourcesContent":["<template>\n  <div>\n    <form id=\"payment-form\">\n      <slot name=\"card-element\">\n        <div id=\"card-element\"></div>\n      </slot>\n      <slot name=\"card-errors\">\n        <div id=\"card-errors\" role=\"alert\"></div>\n      </slot>\n      <button ref=\"submitButtonRef\" type=\"submit\"></button>\n    </form>\n  </div>\n</template>\n\n<script>\nexport default {\n  data () {\n    return {\n      loading: false\n    }\n  },\n  mounted () {\n    this.card.mount('#card-element');\n    this.card.addEventListener('change', ({ error }) => {\n      const displayError = document.getElementById('card-errors');\n      if (error) {\n        displayError.textContent = error.message;\n      } else {\n        displayError.textContent = '';\n      }\n    });\n    \n    this.form.addEventListener('submit', async (event) => {\n      try {\n        this.$emit('loading', true);\n        event.preventDefault();\n        const { token, error } = await this.$stripe.createToken({...this.card, amount: 1000});\n        if (error) {\n          const errorElement = document.getElementById('card-errors');\n          errorElement.textContent = error.message;\n          this.$emit('error', error);\n        } else {\n          this.$emit('token', token);\n        }\n      } catch (e) {\n        this.$emit('error', error);\n      } finally {\n        this.$emit('loading', false);\n      }\n    });\n  },\n  computed: {\n    style () {\n      return {\n        base: {\n          color: '#32325d',\n          fontFamily: '\"Helvetica Neue\", Helvetica, sans-serif',\n          fontSmoothing: 'antialiased',\n          fontSize: '16px',\n          '::placeholder': {\n            color: '#aab7c4'\n          }\n        },\n        invalid: {\n          color: '#fa755a',\n          iconColor: '#fa755a'\n        }\n      };\n    },\n    elements () {\n      return this.$stripe.elements();\n    },\n    card () {\n      return this.elements.create('card', { style: this.style });\n    },\n    form () {\n      return document.getElementById('payment-form');\n    }\n  },\n  methods: {\n    submit () {\n      this.$refs.submitButtonRef.click();\n    }\n  }\n}\n</script>\n\n<style scoped>\n/**\n * The CSS shown here will not be introduced in the Quickstart guide, but shows\n * how you can use CSS to style your Element's container.\n */\n.StripeElement {\n  box-sizing: border-box;\n\n  height: 40px;\n\n  padding: 10px 12px;\n\n  border: 1px solid transparent;\n  border-radius: 4px;\n  background-color: white;\n\n  box-shadow: 0 1px 3px 0 #e6ebf1;\n  -webkit-transition: box-shadow 150ms ease;\n  transition: box-shadow 150ms ease;\n}\n\n.StripeElement--focus {\n  box-shadow: 0 1px 3px 0 #cfd7df;\n}\n\n.StripeElement--invalid {\n  border-color: #fa755a;\n}\n\n.StripeElement--webkit-autofill {\n  background-color: #fefde5 !important;\n}\n</style>"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$1 = "data-v-af342020";
  /* module identifier */
  const __vue_module_identifier__$1 = undefined;
  /* functional template */
  const __vue_is_functional_template__$1 = false;
  /* style inject SSR */
  

  
  var VueStripeElements = normalizeComponent_1(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    browser,
    undefined
  );

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

exports.VueStripeCheckout = VueStripeCheckout;
exports.VueStripeElements = VueStripeElements;
exports.default = Plugin;
