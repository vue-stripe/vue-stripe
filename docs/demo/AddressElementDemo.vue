<script setup>
import { ref } from 'vue';
import { AddressElement, useStripe } from '../../src';

const props = defineProps({
  mode: {
    type: String,
    default: 'shipping',
  },
});

const pk = ref(import.meta.env.VITE_VUE_STRIPE_PUBLISHABLE_KEY);
const clientSecret = ref(import.meta.env.VITE_STRIPE_CLIENT_SECRET);

const { stripe, elements, initializeElements } = useStripe(pk.value);

initializeElements(clientSecret.value);

const options = {
  mode: props.mode,
};
</script>

<template>
  <div style="padding: 20px 0px 0px 0px;" class="flex flex-col w-full gap-8">
    <AddressElement
      :elements="elements"
      :options="options"
    />
  </div>
</template>