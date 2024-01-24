<script setup>
import { ref } from 'vue';
import { VueStripe, Elements, PaymentIntent } from '../../src';

const stripe = ref(null);
const elements = ref(null);
const pk = ref(import.meta.env.VITE_VUE_STRIPE_PUBLISHABLE_KEY);
const clientSecret = ref(import.meta.env.VITE_STRIPE_CLIENT_SECRET);
</script>

<template>
  <div style="padding: 30px 0px;">
    <VueStripe
      ref="stripe"
      :pk="pk"
      #default="{ stripe }"
    >
      <Elements
        ref="elements"
        :stripe="stripe"
        :client-secret="clientSecret"
        #default="{ elements }"
      >
        <PaymentIntent
          ref="paymentIntent"
          :stripe="stripe"
          :elements="elements"
        />
      </Elements>
    </VueStripe>
  </div>

</template>