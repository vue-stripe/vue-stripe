(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.VueStripeCheckout = factory());
}(this, (function () { 'use strict';

const VueStripeCheckout = {
  install(Vue, key) {
    
    if(!key) {
      console.warn('Provide the stripe publishale key!');
      return;
    }
    
    const component = {
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
        open () {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.stripe.com/checkout.js';
            document.getElementsByTagName('head')[0].appendChild(script);
            
            let $checkout = null;

            const { 
              publishableKey,
              image,
              name,
              description,
              amount,
              locale,
              zipCode,
              billingAddress,
              currency,
              panelLabel,
              shippingAddress,
              email,
              allowRememberMe
            } = this;

            setTimeout(() => {
              let useThisKey = key;

              // Use the publishable key from props if available
              // this will override the key from Vue.use(VueStripeCheckout, key).
              if(this.publishableKey) {
                useThisKey = publishableKey;
              } else {
                useThisKey = key;
              }

              $checkout = StripeCheckout.configure({key: useThisKey});

              $checkout.open({
                key: useThisKey,
                image,
                name,
                description,
                amount,
                locale,
                zipCode,
                billingAddress,
                currency,
                panelLabel,
                shippingAddress,
                email,
                allowRememberMe,
                token: (token) => {
                  this.$emit('done', token);
                  resolve(token);
                },
                opened: () => {
                  this.$emit('opened');
                },
                closed: () => {
                  this.$emit('closed');
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

return VueStripeCheckout;

})));
