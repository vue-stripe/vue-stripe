# The Link Authentication Element Component

The Link Authentication Element is an embeddable UI component that allows you to accept a payment with Stripe Link Payment.

<!-- <script setup>
import { PaymentIntent, LinkAuthentication, useStripe } from 'vue-stripe-demi';;
import { onMounted, ref } from 'vue';

const { initStripe, initElements } = useStripe();

const pk = 'pk_test_51OIHqMIx2Vb66eaKneiRI89KWckP2FB7c75OLUZGezoXDiCHlIXMh6dBkTyWRe8oz77CO6B0udvWS6yWWdDaiwS800oW2Na8mk';
const clientSecret = 'pi_3OaBhKIx2Vb66eaK1aVjXXAS_secret_GbvadXNEF04Uzx80WZxqSefKi';

const stripe = ref(null);
const elements = ref(null);


const linkAuthenticationRef = ref(null);
const paymentIntentRef = ref(null);

onMounted(async () => {
  stripe.value = await initStripe(pk, {});
  elements.value = await initElements(stripe.value, clientSecret, {});
});

const confirmParams = {
  return_url: 'https://example.com',
  payment_method_data: {
    billing_details: {
      name: 'Jenny Rosen',
      email: 'jenny.rosen@example.com',
    }
  }
};

const loading = ref(false);

async function submit () {
  await paymentIntentRef.value.submit();
}

// window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => {
//   if (event.matches) {
//     // User has switched to dark mode
//     console.log('dark mode');
//   } else {
//     console.log('light mode');
//   }
// });

</script>

<LinkAuthentication
  ref="linkAuthenticationRef"
  :stripe="stripe"
  :elements="elements"
  :options="{defaultValues: { email: 'foo@bar.com'}}"
  @change="() => console.log('change')"
  @ready="() => console.log('ready')"
  @focus="() => console.log('focus')"
  @blur="() => console.log('blur')"
  @escape="() => console.log('escape')"
/>

<br>

<PaymentIntent
  ref="paymentIntentRef"
  :stripe="stripe"
  :elements="elements"
  :confirm-params="confirmParams"
  @change="() => console.log('change')"
  @ready="() => console.log('ready')"
  @focus="() => console.log('focus')"
  @blur="() => console.log('blur')"
  @escape="() => console.log('escape')"
/> -->