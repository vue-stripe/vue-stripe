import $ from "jquery";

const VueStripeCheckout = {
  install(Vue, key) {
    Vue.component('VueStripeCheckout', {
      data() {
        return {
          token: undefined,
          args: undefined
        };
      },
      render: h => h('div', { style: { display: 'none' } }),
      props: {
        publishableKey: {
          type: String,
          required: !key,
        },
        image: {
          type: String,
          default: null,
        },
        name: {
          type: String,
          default: null,
        },
        description: {
          type: String,
          default: null,
        },
        amount: {
          type: Number,
          default: 0,
        },
        locale: {
          type: String,
          default: 'en',
        },
        zipCode: {
          type: Boolean,
          default: false,
        },
        billingAddress: {
          type: Boolean,
          default: false,
        },
        currency: {
          type: String,
          default: 'USD',
        },
        panelLabel: {
          type: String,
          default: 'Pay with Card',
        },
        shippingAddress: {
          type: Boolean,
          default: false,
        },
        email: {
          type: String,
          default: null,
        },
        allowRememberMe: {
          type: Boolean,
          default: true,
        },
        autoOpenModal: {
          type: Boolean,
          default: false,
        },
      },
      mounted() {
        /*if (document.querySelector('script#_stripe-checkout-script')) {
          return this.setCheckout();
        }*///TODO superheri Why does it stops working with this if?
        const scriptCheckout = document.createElement('script');
        scriptCheckout.id = '_stripe-checkout-script';
        scriptCheckout.src = 'https://checkout.stripe.com/checkout.js';
        scriptCheckout.onload = this.setCheckout;
        document.querySelector('head').append(scriptCheckout);

        const scriptStripeV2 = document.createElement('script');
        scriptStripeV2.id = '_stripe-v2-script';
        scriptStripeV2.src = 'https://js.stripe.com/v2/';//TODO superheri use V3
        scriptStripeV2.onload = this.setCheckout;
        document.querySelector('head').append(scriptStripeV2);

        const scriptFeatherlight = document.createElement('script');
        scriptFeatherlight.id = '_stripe-featherlight-script';
        scriptFeatherlight.src = 'https://cdnjs.cloudflare.com/ajax/libs/featherlight/1.7.6/featherlight.min.js';
        scriptFeatherlight.onload = this.setCheckout;
        document.querySelector('head').append(scriptFeatherlight);//TODO superheri Too much scripts added here. There must be a solution to this...
      },
      // NOTE: Should this be enabled for dynamic keys?
      // Cause if it gets updated very quickly, I
      // would imagine bad things would happen
      // updated() {
      //  this.setCheckout();
      // },
      beforeDestroy() {
        const stripeApp = document.querySelector('iframe.stripe_checkout_app');
        if (stripeApp) stripeApp.remove();
      },
      data: () => ({
        checkout: null,
        doneEmitted: false
      }),
      computed: {
        key() {
          return this.publishableKey || key;
        }
      },
      methods: {
        setCheckout() {
          const stripeApp = document.querySelector(
            'iframe.stripe_checkout_app'
          );
          if (stripeApp) stripeApp.remove();
          this.checkout = StripeCheckout.configure({ key: this.key });
          if (this.autoOpenModal) this.open();
          Stripe.setPublishableKey(this.key);
        },
        open() {
          if (!this.key) {
            return Promise.reject(
              new Error('Public key is required for VueStripeCheckout')
            );
          }
          return new Promise((resolve, _reject) => {
            const options = {
              key: this.key,
              image: this.image,
              name: this.name,
              description: this.description,
              amount: this.amount,
              locale: this.locale,
              zipCode: this.zipCode,
              currency: this.currency,
              panelLabel: this.panelLabel,
              email: this.email,
              billingAddress: this.billingAddress,
              allowRememberMe: this.allowRememberMe,
              token: (token, args) => {
                this.token = token;
                this.args = args;

                Stripe.source.create({
                  type: 'card',
                  token: token.id
                }, this.stripeCardResponseHandler);
              },
              opened: () => { this.$emit('opened') },
              closed: () => {
                if (!this.doneEmitted) {
                  this.$emit('canceled');
                }
                this.$emit('closed');
                this.doneEmitted = false;
                this.token = undefined;
                this.args = undefined;
              },
            };
            if (this.shippingAddress)
              Object.assign(options, {
                shippingAddress: true,
                billingAddress: true,
              });
            this.checkout.open(options);
          });
        },
        stripeCardResponseHandler(status, response) {
          if (response.error) {
            this.displayResult("Unexpected card source creation response status: " + status + ". Error: " + response.error.message);
            return;
          }

          // check if the card supports 3DS
          if (response.card.three_d_secure == 'not_supported') {
            this.displayResult("This card does not support 3D Secure.");
            return;
          }

          // since we're going to use an iframe in this example, the
          // return URL will only be displayed briefly before the iframe
          // is closed. Set it to a static page on your site that says
          // something like "Please wait while your transaction is processed"
          const returnURL = "https://shop.example.com/static_page";//TODO superheri add this into props

          // create the 3DS source from the card source
          Stripe.source.create({
            type: 'three_d_secure',
            amount: 1099,
            currency: "eur",
            three_d_secure: {
              card: response.id
            },
            redirect: {
              return_url: returnURL
            }
          }, this.stripe3DSecureResponseHandler);
        },

        stripe3DSecureResponseHandler(status, response) {
          if (response.error) {
            this.displayResult("Unexpected 3DS source creation response status: " + status + ". Error: " + response.error.message);
            return;
          }

          // check the 3DS source's status
          if (response.status == 'chargeable') {
            this.displayResult("This card does not support 3D Secure authentication, but liability will be shifted to the card issuer.");
            return;
          } else if (response.status != 'pending') {
            this.displayResult("Unexpected 3D Secure status: " + response.status);
            return;
          }

          // start polling the source (to detect the change from pending
          // to either chargeable or failed)
          Stripe.source.poll(
            response.id,
            response.client_secret,
            this.stripe3DSStatusChangedHandler
          );

          // open the redirect URL in an iframe
          // (in this example we're using Featherlight for convenience,
          // but this is of course not a requirement)
          $.featherlight({
            iframe: response.redirect.url,
            iframeWidth: '800',
            iframeHeight: '600'
          });

          console.log(response);
        },

        stripe3DSStatusChangedHandler(status, source) {
          if (source.status == 'chargeable') {
            $.featherlight.current().close();
            this.displayResult('3D Secure authentication succeeded: ' + source.id + '. In a real app you would send this source ID to your backend to create the charge.');
          } else if (source.status == 'failed') {
            $.featherlight.current().close();
            this.displayResult('3D Secure authentication failed.');
          } else if (source.status != 'pending') {
            $.featherlight.current().close();
            this.displayResult("Unexpected 3D Secure status: " + source.status);
          }
        },
        displayResult(resultText) {
          alert(resultText);
          this.$emit('done', { token: this.token, args: this.args });//TODO superheri fix these events
          //resolve({ token: this.token, args: this.args });
          this.doneEmitted = true;
        }
      }
    });
  }
};

export default VueStripeCheckout;
