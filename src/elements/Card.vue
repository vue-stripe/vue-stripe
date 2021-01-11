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
import { DEFAULT_ELEMENT_STYLE } from '../constants';
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
    elementsOptions: {
      type: Object,
      default: () => ({}),
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
      element: null,
      card: null,
    };
  },
  computed: {
    form () {
      return document.getElementById('stripe-element-form');
    },
  },
  mounted () {
    loadStripeSdk(this.apiVersion, () => {
      const stripeOptions = {
        stripeAccount: this.stripeAccount,
        apiVersion: this.apiVersion,
        locale: this.locale,
      };
      const createOptions = {
        classes: this.classes,
        style: this.elementStyle,
        value: this.value,
        hidePostalCode: this.hidePostalCode,
        iconStyle: this.iconStyle,
        hideIcon: this.hideIcon,
        disabled: this.disabled,
      };

      this.stripe = window.Stripe(this.pk, stripeOptions);
      this.elements = this.stripe.elements(this.elementsOptions);
      this.element = this.elements.create(ELEMENT_TYPE, createOptions);
      this.element.mount('#stripe-element-mount-point');

      this.element.on('change', (event) => {
        var displayError = document.getElementById('stripe-element-errors');
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
        this.change(event);
      });

      this.element.on('ready', this.ready);
      this.element.on('focus', this.focus);
      this.element.on('blur', this.blur);
      this.element.on('escape', this.escape);
      this.element.on('click', this.click);

      this.form.addEventListener('submit', async (event) => {
        try {
          this.$emit('loading', true);
          event.preventDefault();
          const data = {
            ...this.element,
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
  },
  methods: {
    submit () {
      this.$refs.submitButtonRef.click();
    },
    change (e) {
      this.$emit('element-change', e);
    },
    ready (e) {
      this.$emit('element-ready', e);
    },
    focus (e) {
      this.$emit('element-focus', e);
    },
    blur (e) {
      this.$emit('element-blur', e);
    },
    escape (e) {
      this.$emit('element-escape', e);
    },
    click (e) {
      this.$emit('element-click', e);
    },
  },
};
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
