# Getting Started

## Installation

### NPM

```bash
npm install @vue-stripe/vue-stripe
```

### Yarn

```bash
yarn add @vue-stripe/vue-stripe
```


### Composable Usage

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { useStripe } from '@vue-stripe/vue-stripe';

const { initStripe } = useStripe();
const stripe = ref(null);

onMounted(async () => {
  // Initialize Stripe.js
  stripe.value = await initStripe('pk_...');
});
</script>
```

### Component Usage

```vue
<script setup>
import { VueStripe, Elements, PaymentIntent } from '@vue-stripe/vue-stripe';
const pk = 'pk_...';
</script>

<template>
  <VueStripe 
    :pk="pk"
    v-slot:default="{ stripe }"
  >
    <Elements 
      :stripe="stripe" 
      :client-secret="clientSecret"
      v-slot:default="{ element }"
    >
      <PaymentIntent 
        :stripe="stripe" 
        :element="element"
      />
    </Elements>
  </VueStripe>
</template>
```