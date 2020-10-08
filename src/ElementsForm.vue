<template>
  <form id="elements-form">
    <slot name="default"></slot>
    <button ref="submitButtonRef" type="submit" class="hide"></button>
  </form>
</template>

<script>
import StripeHelper from './stripe-helper';
export default {
  props: {
    amount: {
      type: Number,
      default: null,
    },
    elements: {
      type: Array,
      default: () => ([]),
    },
  },
  computed: {
    form () {
      return document.getElementById('elements-form');
    },
  },
  methods: {
    submit () {
      this.$refs.submitButtonRef.click();
    },
  },
  async mounted () {
    const { stripe, stripeElements } = await StripeHelper({
      publishableKey: this.$vueStripePublishableKey
    });
    this.form.addEventListener('submit', async (event) => {
      try {
        this.$emit('loading', true);
        event.preventDefault();
        // setup elements
        const cardElement = stripeElements.getElement('cardNumber');
        console.warn(cardElement);
        const data = {
          ...cardElement
        };
        if (this.amount) data.amount = this.amount;
        const { token, error } = await stripe.createToken(data);
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
  }
};
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
