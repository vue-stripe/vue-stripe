module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var VueStripeCheckout = {
  install: function install(Vue, _key) {
    Vue.component('vue-stripe-checkout', {
      render: function render(h) {
        return h('div', { style: { display: 'none' } });
      },
      props: {
        publishableKey: {
          type: String,
          required: !_key
        },
        image: {
          type: String,
          default: null
        },
        name: {
          type: String,
          default: null
        },
        description: {
          type: String,
          default: null
        },
        amount: {
          type: Number,
          default: 0
        },
        locale: {
          type: String,
          default: 'en'
        },
        zipCode: {
          type: Boolean,
          default: false
        },
        billingAddress: {
          type: Boolean,
          default: false
        },
        currency: {
          type: String,
          default: 'USD'
        },
        panelLabel: {
          type: String,
          default: 'Pay with Card'
        },
        shippingAddress: {
          type: Boolean,
          default: false
        },
        email: {
          type: String,
          default: null
        },
        allowRememberMe: {
          type: Boolean,
          default: true
        }
      },
      mounted: function mounted() {
        if (document.querySelector('script#_stripe-checkout-script')) {
          return this.setCheckout();
        }
        var script = document.createElement('script');
        script.id = '_stripe-checkout-script';
        script.src = 'https://checkout.stripe.com/checkout.js';
        script.onload = this.setCheckout;
        document.querySelector('head').append(script);
      },

      // NOTE: Should this be enabled for dynamic keys?
      // Cause if it gets updated very quickly, I
      // would imagine bad things would happen
      // updated() {
      //  this.setCheckout();
      // },
      beforeDestroy: function beforeDestroy() {
        var stripeApp = document.querySelector('iframe.stripe_checkout_app');
        if (stripeApp) stripeApp.remove();
      },

      data: function data() {
        return {
          checkout: null,
          doneEmitted: false
        };
      },
      computed: {
        key: function key() {
          return this.publishableKey || _key;
        }
      },
      methods: {
        setCheckout: function setCheckout() {
          var stripeApp = document.querySelector('iframe.stripe_checkout_app');
          if (stripeApp) stripeApp.remove();
          this.checkout = StripeCheckout.configure({ key: this.key });
        },
        open: function open() {
          var _this = this;

          if (!this.key) {
            return Promise.reject(new Error('Public key is required for VueStripeCheckout'));
          }
          return new Promise(function (resolve, _reject) {
            var options = {
              key: _this.key,
              image: _this.image,
              name: _this.name,
              description: _this.description,
              amount: _this.amount,
              locale: _this.locale,
              zipCode: _this.zipCode,
              currency: _this.currency,
              panelLabel: _this.panelLabel,
              email: _this.email,
              billingAddress: _this.billingAddress,
              allowRememberMe: _this.allowRememberMe,
              token: function token(_token, args) {
                _this.$emit('done', { token: _token, args: args });
                resolve({ token: _token, args: args });
                _this.doneEmitted = true;
              },
              opened: function opened() {
                _this.$emit('opened');
              },
              closed: function closed() {
                if (!_this.doneEmitted) {
                  _this.$emit('canceled');
                }
                _this.$emit('closed');
                _this.doneEmitted = false;
              }
            };
            if (_this.shippingAddress) Object.assign(options, {
              shippingAddress: true,
              billingAddress: true
            });
            _this.checkout.open(options);
          });
        }
      }
    });
  }
};

exports.default = VueStripeCheckout;

/***/ })
/******/ ]);