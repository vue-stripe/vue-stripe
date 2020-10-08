<template>
  <div>
    <form id="payment-form">
      <slot name="card-element">
        <div id="card-element"></div>
      </slot>
      <slot name="card-errors">
        <div id="card-errors" role="alert"></div>
      </slot>
      <button ref="submitButtonRef" type="submit" class="hide"></button>
    </form>
  </div>
</template>

<script>
import { loadStripeSdk } from './load-stripe-sdk';
import { SUPPORTED_ELEMENT_TYPE } from './constants';
export default {
  props: {
    pk: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
    },
    stripeAccount: {
      type: String,
    },
    apiVersion: {
      type: String,
    },
    locale: {
      type: String,
      default: 'auto',
    },
    elementType: {
      type: String,
      default: 'card',
      validator: value => SUPPORTED_ELEMENT_TYPE.includes(value),
    },
    elementStyle: {
      type: Object,
      default: () => ({
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4',
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a',
        },
      }),
    },
  },
  data () {
    return {
      loading: false,
      stripe: null,
      elements: null,
      card: null,
    };
  },
  computed: {
    form () {
      return document.getElementById('payment-form');
    },
  },
  methods: {
    submit () {
      this.$refs.submitButtonRef.click();
    },
  },
  mounted () {
    loadStripeSdk('v3', () => {
      const options = {
        stripeAccount: this.stripeAccount,
        apiVersion: this.apiVersion,
        locale: this.locale,
      };
      this.stripe = window.Stripe(this.pk, options);
      this.element = this.stripe.elements().create(this.elementType, { style: this.elementStyle });
      this.element.mount('#card-element');

      this.element.addEventListener('change', ({ error }) => {
        const displayError = document.getElementById('card-errors');
        if (error) {
          displayError.textContent = error.message;
          return;
        }
        displayError.textContent = '';
      });
      
      this.form.addEventListener('submit', async (event) => {
        try {
          this.$emit('loading', true);
          event.preventDefault();
          const data = {
            ...this.element
          };
          if (this.amount) data.amount = this.amount;
          const { token, error } = await this.stripe.createToken(data);
          if (error) {
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = error.message;
            console.error(error);
            this.$emit('error 1', error);
            return;
          }
          this.$emit('token', token);
        } catch (error) {
          console.error(error);
          this.$emit('error', error);
        } finally {
          this.$emit('loading', false);
        }
      });
    });
  }
}
</script>

<style scoped>
.StripeElement {
  box-sizing: border-box;

  height: 40px;

  padding: 10px 12px;

  border: 1px solid transparent;
  border-radius: 4px;
  background-color: white;

  box-shadow: 0 1px 3px 0 #e6ebf1;
  -webkit-transition: box-shadow 150ms ease;
  transition: box-shadow 150ms ease;
}

.StripeElement--focus {
  box-shadow: 0 1px 3px 0 #cfd7df;
}

.StripeElement--invalid {
  border-color: #fa755a;
}

.StripeElement--webkit-autofill {
  background-color: #fefde5 !important;
}

.hide {
  visibility: hidden;
}
</style>
