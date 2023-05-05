var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// package.json
var require_package = __commonJS({
  "package.json"(exports, module) {
    module.exports = {
      name: "@vue-stripe/vue-stripe",
      version: "5.0.0",
      description: "Stripe Checkout & Elements for Vue.js",
      author: "jofftiquez@gmail.com",
      main: "dist/index.js",
      type: "commonjs",
      scripts: {
        build: "node esbuild.js",
        "build:rollup": "rollup --config",
        lint: "eslint --fix --ext .js,.vue ./"
      },
      dependencies: {
        "@stripe/stripe-js": "^1.13.2"
      },
      devDependencies: {
        "@babel/core": "^7.20.12",
        "@babel/eslint-parser": "^7.13.14",
        "@babel/plugin-proposal-optional-chaining": "^7.20.7",
        "@babel/preset-env": "^7.20.2",
        "@rollup/plugin-babel": "^6.0.3",
        "@rollup/plugin-commonjs": "^24.0.1",
        "@rollup/plugin-node-resolve": "^15.0.1",
        "@rollup/plugin-terser": "^0.4.0",
        esbuild: "^0.17.5",
        "esbuild-plugin-vue3": "^0.3.2",
        eslint: "^8.10.0",
        "eslint-config-standard": "^17.0.0",
        "eslint-plugin-import": "^2.19.1",
        "eslint-plugin-n": "^15.0.0",
        "eslint-plugin-promise": "^6.0.0",
        "eslint-plugin-vue": "^9.0.0",
        "eslint-webpack-plugin": "^3.1.1",
        rimraf: "^4.1.2",
        rollup: "^3.12.0"
      },
      peerDependencies: {
        vue: "^3.2.45"
      },
      bugs: {
        url: "https://github.com/vue-stripe/vue-stripe/issues"
      },
      gitHooks: {
        "pre-commit": "lint-staged"
      },
      homepage: "https://github.com/vue-stripe/vue-stripe#readme",
      keywords: [
        "vue",
        "vuejs",
        "stripe",
        "checkout",
        "payment"
      ],
      license: "MIT",
      repository: {
        type: "git",
        url: "git@github.com:vue-stripe/vue-stripe.git"
      },
      typings: "typings/index.d.ts",
      engines: {
        node: "16"
      }
    };
  }
});

// node_modules/@stripe/stripe-js/dist/stripe.esm.js
var V3_URL = "https://js.stripe.com/v3";
var V3_URL_REGEX = /^https:\/\/js\.stripe\.com\/v3\/?(\?.*)?$/;
var EXISTING_SCRIPT_MESSAGE = "loadStripe.setLoadParameters was called but an existing Stripe.js script already exists in the document; existing script parameters will be used";
var findScript = function findScript2() {
  var scripts = document.querySelectorAll('script[src^="'.concat(V3_URL, '"]'));
  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];
    if (!V3_URL_REGEX.test(script.src)) {
      continue;
    }
    return script;
  }
  return null;
};
var injectScript = function injectScript2(params) {
  var queryString = params && !params.advancedFraudSignals ? "?advancedFraudSignals=false" : "";
  var script = document.createElement("script");
  script.src = "".concat(V3_URL).concat(queryString);
  var headOrBody = document.head || document.body;
  if (!headOrBody) {
    throw new Error("Expected document.body not to be null. Stripe.js requires a <body> element.");
  }
  headOrBody.appendChild(script);
  return script;
};
var registerWrapper = function registerWrapper2(stripe, startTime) {
  if (!stripe || !stripe._registerWrapper) {
    return;
  }
  stripe._registerWrapper({
    name: "stripe-js",
    version: "1.52.1",
    startTime
  });
};
var stripePromise = null;
var loadScript = function loadScript2(params) {
  if (stripePromise !== null) {
    return stripePromise;
  }
  stripePromise = new Promise(function(resolve, reject) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(null);
      return;
    }
    if (window.Stripe && params) {
      console.warn(EXISTING_SCRIPT_MESSAGE);
    }
    if (window.Stripe) {
      resolve(window.Stripe);
      return;
    }
    try {
      var script = findScript();
      if (script && params) {
        console.warn(EXISTING_SCRIPT_MESSAGE);
      } else if (!script) {
        script = injectScript(params);
      }
      script.addEventListener("load", function() {
        if (window.Stripe) {
          resolve(window.Stripe);
        } else {
          reject(new Error("Stripe.js not available"));
        }
      });
      script.addEventListener("error", function() {
        reject(new Error("Failed to load Stripe.js"));
      });
    } catch (error) {
      reject(error);
      return;
    }
  });
  return stripePromise;
};
var initStripe = function initStripe2(maybeStripe, args, startTime) {
  if (maybeStripe === null) {
    return null;
  }
  var stripe = maybeStripe.apply(void 0, args);
  registerWrapper(stripe, startTime);
  return stripe;
};
var stripePromise$1 = Promise.resolve().then(function() {
  return loadScript(null);
});
var loadCalled = false;
stripePromise$1["catch"](function(err) {
  if (!loadCalled) {
    console.warn(err);
  }
});
var loadStripe = function loadStripe2() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  loadCalled = true;
  var startTime = Date.now();
  return stripePromise$1.then(function(maybeStripe) {
    return initStripe(maybeStripe, args, startTime);
  });
};

// src/constants/index.js
var VUE_STRIPE_VERSION = require_package().version;
var STRIPE_PARTNER_DETAILS = {
  name: "vue-stripe",
  version: VUE_STRIPE_VERSION,
  url: "https://vuestripe.com",
  partner_id: "pp_partner_IqtOXpBSuz0IE2"
};
var PAYMENT_ELEMENT_TYPE = "payment";

// src/stripe/checkout.js
import { onMounted, ref } from "vue";
var useCheckout = (pk, options) => {
  const stripe = ref(null);
  if (options?.disableAdvancedFraudDetection) {
    loadStripe.setLoadParameters({ advancedFraudSignals: false });
  }
  const stripeOptions = {
    stripeAccount: options?.stripeAccount,
    apiVersion: options?.apiVersion,
    locale: options?.locale
  };
  onMounted(async () => {
    stripe.value = await loadStripe(pk, stripeOptions);
    stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
  });
  async function redirectToCheckout(options2) {
    try {
      if (options2?.sessionId) {
        stripe.value.redirectToCheckout({
          sessionId: options2.sessionId
        });
        return;
      }
      if (options2?.lineItems?.length && !options2?.mode) {
        throw new Error("Error: Property 'mode' is required when using 'lineItems'. See https://stripe.com/docs/js/checkout/redirect_to_checkout#stripe_checkout_redirect_to_checkout-options-mode");
      }
      if (!options2?.successUrl || !options2?.cancelUrl) {
        throw new Error("Error: successUrl and cancelUrl is required.");
      }
      const checkoutOptions = {
        billingAddressCollection: options2?.billingAddressCollection,
        cancelUrl: options2.cancelUrl,
        clientReferenceId: options2?.clientReferenceId,
        customerEmail: options2?.customerEmail,
        items: options2?.items,
        lineItems: options2?.lineItems,
        locale: options2?.locale,
        mode: options2?.mode,
        shippingAddressCollection: options2?.shippingAddressCollection,
        submitType: options2?.submitType,
        successUrl: options2.successUrl
      };
      stripe.value.redirectToCheckout(checkoutOptions);
    } catch (e) {
      console.error(e);
    }
  }
  return {
    stripe,
    redirectToCheckout
  };
};

// src/stripe/elements.js
import { ref as ref2 } from "vue";

// src/utilities/index.js
var hasElementIntent = (options) => {
  return options.mode && options.currency && options.amount;
};

// src/stripe/elements.js
var useElements = () => {
  const elements = ref2(null);
  function createElements(stripe, options) {
    if (!stripe?.value) {
      throw new Error("Error: Stripe instance is not initiated!");
    }
    if (!hasElementIntent(options)) {
      throw new Error("Error: Properties 'mode', 'amount', and 'currency' is required!");
    } else if (!options.clientSecret) {
      throw new Error("Error: 'clientsSecret' is required!");
    }
    const elementsInstance = stripe.elements(options);
    elements.value = elementsInstance;
    return elementsInstance;
  }
  return {
    elements,
    createElements
  };
};

// src/stripe/payment-element.js
import { onMounted as onMounted2 } from "vue";
var usePaymentElement = (elements, options) => {
  onMounted2(() => {
    elements.create(PAYMENT_ELEMENT_TYPE, options);
  });
};

// src/stripe/index.js
import { ref as ref3 } from "vue";
var useStripe = () => {
  const stripe = ref3(null);
  async function initialize(pk, options) {
    if (options?.disableAdvancedFraudDetection)
      loadStripe.setLoadParameters({ advancedFraudSignals: false });
    const stripeOptions = {
      stripeAccount: options?.stripeAccount,
      apiVersion: options?.apiVersion,
      locale: options?.locale
    };
    stripe.value = await loadStripe(pk, stripeOptions);
    stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
    return stripe.value;
  }
  return {
    stripe,
    initialize
  };
};

// sfc-script:D:\Github_Projects\vue-stripe\src\stripe\PaymentElement.vue?type=script
import { ref as ref4, onMounted as onMounted3 } from "vue";
var PaymentElement_default = {
  props: {
    pk: {
      type: String,
      default: void 0,
      required: true
    },
    stripeAccount: {
      type: String,
      default: void 0
    },
    apiVersion: {
      type: String,
      default: void 0
    },
    locale: {
      type: String,
      default: void 0
    },
    disableAdvancedFraudDetection: {
      type: Boolean,
      default: false
    },
    //
    elementsOptions: {
      type: Object,
      default: () => ({}),
      validator: (value) => {
        return true;
      }
    },
    paymentElementOptions: {
      type: Object,
      default: () => ({}),
      validator: (value) => {
        return true;
      }
    },
    confirmParams: {
      type: Object,
      default: () => ({}),
      validator: (value) => {
        return true;
      }
    }
  },
  setup(props, { emit }) {
    const stripe = ref4(null);
    const elements = ref4(null);
    const paymentElement = ref4(null);
    if (props?.disableAdvancedFraudDetection) {
      loadStripe.setLoadParameters({ advancedFraudSignals: false });
    }
    onMounted3(async () => {
      const pk = props?.pk;
      console.log(props);
      const stripeOptions = {
        stripeAccount: props.stripeAccount,
        apiVersion: props.apiVersion,
        locale: props.locale
      };
      stripe.value = await loadStripe(pk, stripeOptions);
      stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
      elements.value = stripe.value.elements(props?.elementsOptions);
      paymentElement.value = elements.value.create(
        PAYMENT_ELEMENT_TYPE,
        props?.paymentElementOptions
      );
      paymentElement.value.mount("#vue-stripe-payment-element-mount-point");
      paymentElement.value.on("change", (event) => {
        const displayError = document.getElementById(
          "vue-stripe-payment-element-errors"
        );
        if (event?.error) {
          displayError.textContent = event?.error?.message;
        } else {
          displayError.textContent = "";
        }
        emit("element-change", event);
      });
      paymentElement.value.on("ready", (event) => {
        emit("element-ready", event);
      });
      paymentElement.value.on("focus", (event) => {
        emit("element-focus", event);
      });
      paymentElement.value.on("blur", (event) => {
        emit("element-blur", event);
      });
      paymentElement.value.on("escape", (event) => {
        emit("element-escape", event);
      });
      paymentElement.value.on("click", (event) => {
        emit("element-click", event);
      });
    });
    return {
      paymentElement
    };
  },
  methods: {
    submit() {
      try {
        this.$emit("loading", true);
      } catch (error) {
        this.$emit("error", error);
      }
    },
    /**
     * Blurs the [Element](https://stripe.com/docs/js/element)
     */
    blur() {
      this.paymentElement.blur();
    },
    /**
     * Clears the values of the [Element](https://stripe.com/docs/js/element)
     */
    clear() {
      this.paymentElement.clear();
    },
    /**
     * Destroys the [Element](https://stripe.com/docs/js/element).
     * A destroyed `Element` cannot be re-activated or re-mounted to the DOM
     */
    destroy() {
      this.paymentElement.destroy();
    },
    /**
     * Focuses the [Element](https://stripe.com/docs/js/element)
     * This method will currently not work on iOS 13+ due to a system limitation.
     */
    focus() {
      console.warn(
        "This method will currently not work on iOS 13+ due to a system limitation."
      );
      this.paymentElement.focus();
    },
    /**
     * Unmounts the [Element](https://stripe.com/docs/js/element)
     */
    unmount() {
      this.paymentElement.unmount();
    },
    /**
     * Retrieves the current [Element](https://stripe.com/docs/js/element)
     *
     * @returns [Payment Element](https://stripe.com/docs/js/element/payment_element) Object
     */
    getElement() {
      this.elements.getElement(PAYMENT_ELEMENT_TYPE);
    },
    /**
     * Updates the [Element](https://stripe.com/docs/js/element)
     *
     * See full docs here: https://stripe.com/docs/js/elements_object/update_payment_element
     */
    update: (options) => {
      (void 0).paymentElement.update(options);
    }
  }
};

// sfc-template:D:\Github_Projects\vue-stripe\src\stripe\PaymentElement.vue?type=template
import { createElementVNode as _createElementVNode, renderSlot as _renderSlot, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue";
var _hoisted_1 = /* @__PURE__ */ _createElementVNode(
  "div",
  { id: "vue-stripe-payment-element-mount-point" },
  null,
  -1
  /* HOISTED */
);
var _hoisted_2 = /* @__PURE__ */ _createElementVNode(
  "div",
  {
    id: "vue-stripe-payment-element-errors",
    role: "alert"
  },
  null,
  -1
  /* HOISTED */
);
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return _openBlock(), _createElementBlock(
    _Fragment,
    null,
    [
      _hoisted_1,
      _renderSlot(_ctx.$slots, "vue-stripe-payment-element-errors", {}, () => [
        _hoisted_2
      ])
    ],
    64
    /* STABLE_FRAGMENT */
  );
}

// src/stripe/PaymentElement.vue
PaymentElement_default.render = render;
PaymentElement_default.__file = "src\\stripe\\PaymentElement.vue";
var PaymentElement_default2 = PaymentElement_default;

// src/plugins/index.js
var plugins_default = {
  async install(app, { pk, stripeAccount, apiVersion, locale }) {
    if (!pk)
      throw new Error("Publishable key is required");
    const stripeOptions = {};
    if (stripeAccount)
      stripeOptions.stripeAccount = stripeAccount;
    if (apiVersion)
      stripeOptions.apiVersion = apiVersion;
    if (locale)
      stripeOptions.locale = locale;
    const stripe = await loadStripe(pk, stripeOptions);
    stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
    app.mixin({
      computed: {
        $stripe() {
          return stripe;
        }
      }
    });
    app.provide("$stripe", stripe);
  }
};
export {
  PaymentElement_default2 as PaymentElement,
  plugins_default as VueStripePlugin,
  useCheckout,
  useElements,
  usePaymentElement,
  useStripe
};
