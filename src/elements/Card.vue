<template>
  <div>
    <form id="stripe-element-form">
      <div id="stripe-element-mount-point"></div>
      <slot name="stripe-element-errors">
        <div id="stripe-element-errors" role="alert"></div>
      </slot>
      <button ref="submitButtonRef" type="submit" class="hide"></button>
    </form>
  </div>
</template>

<script>
import { loadStripeSdk } from '../load-stripe-sdk';
import { SUPPORTED_ELEMENT_TYPE, DEFAULT_ELEMENT_STYLE } from '../constants';
const ELEMENT_TYPE = 'card';
export default {
  props: {
    pk: {
      type: String,
      required: true,
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
    // element specific options
    classes: {
      type: Object,
      default: () => ({}),
    },
    elementStyle: {
      type: Object,
      default: () => (DEFAULT_ELEMENT_STYLE),
    },
    value: {
      type: String,
    },
    hidePostalCode: Boolean,
    iconStyle: {
      type: String,
      default: 'default',
      validator: value => ['solid', 'default'].includes(value),
    },
    hideIcon: Boolean,
    disabled: Boolean,
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
      return document.getElementById('stripe-element-form');
    },
  },
  methods: {
    submit () {
      this.$refs.submitButtonRef.click();
    },
  },
  mounted () {
    loadStripeSdk(this.apiVersion, () => {
      const stripeOptions = {
        stripeAccount: this.stripeAccount,
        apiVersion: this.apiVersion,
        locale: this.locale,
      };
      const elementOptions = {
        classes: this.classes,
        style: this.elementStyle,
        value: this.value,
        hidePostalCode: this.hidePostalCode,
        iconStyle: this.iconStyle,
        hideIcon: this.hideIcon,
        disabled: this.disabled,
      };

      this.stripe = window.Stripe(this.pk, stripeOptions);
      this.element = this.stripe
        .elements()
        .create(ELEMENT_TYPE, elementOptions)
      this.element.mount('#stripe-element-mount-point');

      this.element.on('change', (event) => {
        var displayError = document.getElementById('stripe-element-errors');
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
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
            const errorElement = document.getElementById('stripe-element-errors');
            errorElement.textContent = error.message;
            this.$emit('error', error);
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
/**
 * The CSS shown here will not be introduced in the Quickstart guide, but shows
 * how you can use CSS to style your Element's container.
 */
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
