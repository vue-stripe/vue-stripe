<script setup>
import { ref } from 'vue';
import { PaymentElement, useStripe } from '../../src';

const pk = ref(import.meta.env.VITE_VUE_STRIPE_PUBLISHABLE_KEY);
const clientSecret = ref(import.meta.env.VITE_STRIPE_CLIENT_SECRET);

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);

// async function onSubmit () {
//   try {
//     stripe.value.confirmPayment({
//       elements: elements.value,
//       confirmParams: {
//         return_url: 'http://localhost:3000/success',
//       },
//     });
//   } catch (e) {
//     console.error(e);
//   }
// };
</script>

<template>
  <div style="padding: 20px 0px 0px 0px;" class="flex flex-col w-full gap-8">
    <PaymentElement
      :stripe="stripe"
      :elements="elements"
    />
  </div>
</template>