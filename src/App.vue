
<template>
  <div style="padding: 50px;">
    <h1>Address Element</h1>
    <AddressElement
      :pk="PUBLIC_KEY"
      :addressElementOptions="addressElementOptions"
      @element-change="handleChange"
    />
  </div>

  <div style="padding: 50px;">
    <h1>Express Checkout Element</h1>
    <ExpressCheckoutElement
      :pk="PUBLIC_KEY"
      :elementOptions="expressCheckoutElementOptions"
      @element-change="handleChange"
    />
  </div>

  <div style="padding: 50px;">
    <h1>Link Authentication Element</h1>
    <LinkAuthenticationElement
      :pk="PUBLIC_KEY"
      :elementOptions="linkAuthenticationElementOptions"
      @element-change="handleChange"
    />
  </div>

  <div style="padding: 50px;">
    <h1>Payment Element</h1>
    <PaymentElement
      :pk="PUBLIC_KEY"
      :elementOptions="paymentElementOptions"
      @element-change="handleChange"
    />
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import useStripe from './vue-stripe/composables/useStripe';
import AddressElement from './vue-stripe/components/AddressElement/AddressElement.vue';
import ExpressCheckoutElement from './vue-stripe/components/ExpressCheckoutElement/ExpressCheckoutElement.vue';
import LinkAuthenticationElement from './vue-stripe/components/LinkAuthenticationElement/LinkAuthenticationElement.vue';
import PaymentElement from './vue-stripe/components/PaymentElement/PaymentElement.vue';

export default {
  components: {
    AddressElement,
    ExpressCheckoutElement,
    LinkAuthenticationElement,
    PaymentElement,
  },
  setup () {
    const PUBLIC_KEY = 'pk_test_INH6o8QUdJyZM1TuGKs5PIsT';

    const addressElementOptions = {
      mode: 'billing',
    };

    const expressCheckoutElementOptions = {
      mode: 'payment',
      currency: 'usd',
      amount: 1099,
      appearance: {},
    };

    // Link Authentication

    const { initialize } = useStripe();
    initialize(PUBLIC_KEY);

    const clientSecret = ref('');
    const linkAuthenticationElementOptions = ref({});

    watch(clientSecret, (val) => {
      // Set the element options once client secret is not null
      if (val) {
        linkAuthenticationElementOptions.value = {
          clientSecret: val,
          appearance: {
            theme: 'night',
          },
        };

        paymentElementOptions.value = {
          clientSecret: val,
          appearance: {
            theme: 'night',
          },
        };
      }
    });

    onMounted(async () => {
      await initialize(PUBLIC_KEY);

      // Create payment intent upon page load.
      const res = await fetch('http://localhost:3000/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: [{ id: 'xl-tshirt' }] }),
      });

      const resJson = await res.json();
      console.warn('resJson', resJson);

      clientSecret.value = resJson?.clientSecret;
    });

    // Payment Element
    const paymentElementOptions = ref({
      layout: 'accordion',
      paymentMethodOrder: ['affirm'],
    });

    // Functions
    function handleChange (event) {
      console.log(event);
    }

    return {
      PUBLIC_KEY,
      addressElementOptions,
      expressCheckoutElementOptions,
      linkAuthenticationElementOptions,
      paymentElementOptions,
      handleChange,
    };
  },
};
</script>
