<template>
  <div>
    <slot name="checkout-button">
      <button @click="redirectToCheckout">Checkout</button>
    </slot>
  </div>
</template>

<script>
import {
  SUPPORTED_LANGS,
  SUPPORTED_SUBMIT_TYPES,
  BILLING_ADDRESS_COLLECTION_TYPES
} from './constants';
import { loadStripeCheckout } from './load-checkout';
export default {
  props: {
    pk: {
      type: String,
      required: true
    },
    mode:{
      type: String,
      default: undefined
    },
    lineItems: {
      type: Array,
      default: undefined
    },
    items: {
      type: Array,
      default: undefined
    },
    successUrl: {
      type: String,
      default: window.location.href
    },
    cancelUrl: {
      type: String,
      default: window.location.href
    },
    submitType: {
      type: String,
      validator: (value) => SUPPORTED_SUBMIT_TYPES.includes(value)
    },
    billingAddressCollection: {
      type: String,
      default: 'auto',
      validator: (value) => BILLING_ADDRESS_COLLECTION_TYPES.includes(value)
    },
    clientReferenceId: {
      type: String,
      default: undefined
    },
    customerEmail: {
      type: String,
      default: undefined
    },
    sessionId: {
      type: String,
      default: undefined
    },
    locale: {
      type: String,
      default: 'auto',
      validator: (value) => SUPPORTED_LANGS.includes(value)
    }
  },
  methods: {
    redirectToCheckout () {
      this.$emit('loading', true);
      loadStripeCheckout(this.pk, 'v3', () => {
        try {
          let stripe = window.Stripe(this.pk);
          if (!this.sessionId) {
            if(this.mode){
              // new price request
              // sample
              // mode: 'payment'
              // lineItems: [
              //   {
              //     price: 'price_xxxx',
              //     quantity: 1
              //   }
              // ]
              stripe.redirectToCheckout({
                billingAddressCollection: this.billingAddressCollection,
                cancelUrl: this.cancelUrl,
                clientReferenceId: this.clientReferenceId,
                customerEmail: this.customerEmail,
                lineItems: this.lineItems,
                locale: this.locale,
                mode: this.mode,
                submitType: this.submitType,
                successUrl: this.successUrl,
              });
            } else {
              // old sku request
              // sample
              // items: [
              //   {
              //     type: 'sku',
              //     parent: 'sku_xxxx',
              //     quantity: 2
              //   }
              // ]
              stripe.redirectToCheckout({
                billingAddressCollection: this.billingAddressCollection,
                cancelUrl: this.cancelUrl,
                clientReferenceId: this.clientReferenceId,
                customerEmail: this.customerEmail,
                items: this.items,
                locale: this.locale,
                submitType: this.submitType,
                successUrl: this.successUrl,
              });
            }
          } else {
            stripe.redirectToCheckout({
              sessionId: this.sessionId
            });
          }
        } catch (e) {
          console.error(e);
          this.$emit('error', e);
        } finally {
          this.$emit('loading', false);
        }
      });
    }
  }
}
</script>