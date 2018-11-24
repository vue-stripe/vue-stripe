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

var _stripeCheckout = __webpack_require__(1);

Object.keys(_stripeCheckout).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _stripeCheckout[key];
    }
  });
});

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var VueStripeCheckout = {
  install: function install(Vue, key) {

    if (!key) {
      console.warn('Provide the stripe publishale key!');
      return;
    }

    var component = {
      template: '<div></div>',
      props: {
        publishableKey: String,
        image: String,
        name: String,
        description: String,
        amount: Number,
        locale: {
          type: String,
          default: ''
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
          default: ''
        },
        shippingAddress: {
          type: Boolean,
          default: false
        },
        email: String,
        allowRememberMe: {
          type: Boolean,
          default: true
        }
      },
      methods: {
        open: function open() {
          var _this = this;

          return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = 'https://checkout.stripe.com/checkout.js';
            document.getElementsByTagName('head')[0].appendChild(script);

            var $checkout = null;

            var publishableKey = _this.publishableKey,
                image = _this.image,
                name = _this.name,
                description = _this.description,
                amount = _this.amount,
                locale = _this.locale,
                zipCode = _this.zipCode,
                billingAddress = _this.billingAddress,
                currency = _this.currency,
                panelLabel = _this.panelLabel,
                shippingAddress = _this.shippingAddress,
                email = _this.email,
                allowRememberMe = _this.allowRememberMe;


            setTimeout(function () {
              var useThisKey = key;

              // Use the publishable key from props if available
              // this will override the key from Vue.use(VueStripeCheckout, key).
              if (_this.publishableKey) {
                useThisKey = publishableKey;
              } else {
                useThisKey = key;
              }

              $checkout = StripeCheckout.configure({ key: useThisKey });

              $checkout.open({
                key: useThisKey,
                image: image,
                name: name,
                description: description,
                amount: amount,
                locale: locale,
                zipCode: zipCode,
                billingAddress: billingAddress,
                currency: currency,
                panelLabel: panelLabel,
                shippingAddress: shippingAddress,
                email: email,
                allowRememberMe: allowRememberMe,
                token: function token(_token) {
                  _this.$emit('done', _token);
                  resolve(_token);
                },
                opened: function opened() {
                  _this.$emit('opened');
                },
                closed: function closed() {
                  _this.$emit('closed');
                }
              });
            }, 500);
          });
        }
      }
    };

    Vue.component('vue-stripe-checkout', component);
  }
};

exports.default = VueStripeCheckout;

/***/ })
/******/ ]);