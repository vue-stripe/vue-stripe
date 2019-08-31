<template>
  <div>
    <form id="payment-form">
      <slot name="card-element">
        <div id="card-element"></div>
      </slot>
      <slot name="card-errors">
        <div id="card-errors" role="alert"></div>
      </slot>
      <button ref="submitButtonRef" type="submit"></button>
    </form>
  </div>
</template>

<script>
export default {
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
</style>