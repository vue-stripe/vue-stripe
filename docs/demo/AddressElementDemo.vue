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

const addressElementRef = ref(null);
const address = ref(null);
async function onGetValue () {
  address.value = await addressElementRef.value.getValue();
}
</script>

<template>
  <div style="padding: 20px 0px 0px 0px;" class="flex flex-col w-full gap-8">
    <AddressElement
      ref="addressElementRef"
      :elements="elements"
      :options="options"
    />
    <br>
    <button class="btn" @click="onGetValue">Get Address</button>
    <div v-if="address">
      <pre>{{ address }}</pre>
      <button class="btn" @click="address = null">Clear</button>
    </div>
  </div>
</template>