<template>
  <div id="stripe-payment-request-button">
  </div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js/dist/pure.esm.js';
const ELEMENT_TYPE = 'paymentRequestButton';
export default {
  props: {
    pk: {
      type: String,
      required: true,
    },
    apiVersion: {
      type: String,
    },
    country: {
      type: String,
      default: null,
    },
    currency: {
      type: String,
      default: null,
    },
    totalLabel: {
      type: String,
      default: null,
    },
    totalAmount: {
      type: Number,
      default: null,
    },
    requestPayerName: Boolean,
    requestPayerEmail: Boolean,
    clientSecret: {
      type: String,
      default: null,
    },
  },
  data () {
    return {
      loading: false,
      stripe: null,
      paymentRequest: null,
      elements: null,
      element: null,
      card: null,
    };
  },
  async mounted () {
    const stripeOptions = {
      stripeAccount: this.stripeAccount,
      apiVersion: this.apiVersion,
    };

    this.stripe = await loadStripe(this.pk, stripeOptions);
    this.paymentRequest = this.stripe.paymentRequest({
      country: this.country,
      currency: this.currency,
      total: {
        label: this.totalLabel,
        amount: this.totalAmount,
      },
      requestPayerName: this.requestPayerName,
      requestPayerEmail: this.requestPayerEmail,
    });
    this.elements = this.stripe.elements(this.elementsOptions);
    this.element = this.elements.create(ELEMENT_TYPE, {
      paymentRequest: this.paymentRequest,
    });
    // TODO: make canMakePayment work
    const result = await this.paymentRequest.canMakePayment();
    console.warn('canMakePayment', result);
    if (result) {
      this.element.mount('#stripe-payment-request-button');
      this.element.on('paymentmethod', this.onPaymentmethod);
    }
  },
  methods: {
    // TODO: Test this
    async onPaymentmethod (e) {
      // Confirm the PaymentIntent without handling potential next actions (yet).
      const { paymentIntent, error: confirmError } = await this.stripe.confirmCardPayment(
        this.clientSecret,
        { payment_method: e.paymentMethod.id },
        { handleActions: false },
      );

      if (confirmError) {
        // Report to the browser that the payment failed, prompting it to
        // re-show the payment interface, or show an error message and close
        // the payment interface.
        e.complete('fail');
      } else {
        // Report to the browser that the confirmation was successful, prompting
        // it to close the browser payment method collection interface.
        e.complete('success');
        // Check if the PaymentIntent requires any actions and if so let Stripe.js
        // handle the flow. If using an API version older than "2019-02-11" instead
        // instead check for: `paymentIntent.status === "requires_source_action"`.
        if (paymentIntent.status === 'requires_action') {
          // Let Stripe.js handle the rest of the payment flow.
          const { error } = await this.stripe.confirmCardPayment(this.clientSecret);
          if (error) {
            // The payment failed -- ask your customer for a new payment method.
            this.$emit('error', error);
          } else {
            // The payment has succeeded.
            this.$emit('success');
          }
        } else {
          // The payment has succeeded.
          this.$emit('success');
        }
      }
    },
  },
};
</script>
