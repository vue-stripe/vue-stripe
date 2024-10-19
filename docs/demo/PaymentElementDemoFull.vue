<script setup>
import { ref } from 'vue';
import { PaymentElement, useStripe } from '../../src';

const pk = ref(import.meta.env.VITE_VUE_STRIPE_PUBLISHABLE_KEY);
const clientSecret = ref(import.meta.env.VITE_STRIPE_CLIENT_SECRET);

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);

const elementRef = ref(null);
</script>

<template>
  <div style="padding: 20px 0px 0px 0px;" class="flex flex-col w-full gap-8">
    <PaymentElement
      ref="elementRef"
      :elements="elements"
    />
  </div>
</template>