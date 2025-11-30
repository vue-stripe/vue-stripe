# Installation

## Package Installation

Install Vue Stripe and the Stripe.js types:

::: code-group
```bash [npm]
npm install @vue-stripe/vue-stripe @stripe/stripe-js
```

```bash [pnpm]
pnpm add @vue-stripe/vue-stripe @stripe/stripe-js
```

```bash [yarn]
yarn add @vue-stripe/vue-stripe @stripe/stripe-js
```
:::

## Get Your API Keys

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Keep your **Secret key** secure on your server (starts with `sk_test_`)

::: warning Never expose your Secret Key
The publishable key is safe to use in frontend code. The secret key must only be used on your server.
:::

## Framework-Specific Setup

Choose your framework below for detailed setup instructions.

### Vite + Vue 3

The most common modern Vue setup.

#### 1. Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

#### 2. Basic Usage

```vue
<script setup>
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement />
    </StripeElements>
  </StripeProvider>
</template>
```

#### 3. TypeScript Support

Vue Stripe is written in TypeScript and provides full type definitions out of the box:

```typescript
import type {
  Stripe,
  StripeElements,
  PaymentIntent
} from '@vue-stripe/vue-stripe'
```

---

### Nuxt 3

Nuxt 3 requires special handling for client-side only components since Stripe.js cannot run on the server.

#### 1. Environment Variables

Add to your `.env` file:

```env
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

Update `nuxt.config.ts` to expose the variable:

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    }
  }
})
```

#### 2. Create a Client-Only Wrapper

Create `components/StripeWrapper.client.vue` (the `.client` suffix ensures it only runs on client):

```vue
<script setup lang="ts">
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'

const config = useRuntimeConfig()
const publishableKey = config.public.stripePublishableKey

defineProps<{
  clientSecret: string
}>()
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <slot />
    </StripeElements>
  </StripeProvider>
</template>
```

#### 3. Usage in Pages

```vue
<script setup>
const clientSecret = ref('')

// Fetch client secret from your API
onMounted(async () => {
  const { data } = await useFetch('/api/create-payment-intent')
  clientSecret.value = data.value.clientSecret
})
</script>

<template>
  <ClientOnly>
    <StripeWrapper v-if="clientSecret" :client-secret="clientSecret">
      <StripePaymentElement @change="onChange" />
      <button @click="handleSubmit">Pay</button>
    </StripeWrapper>
    <template #fallback>
      <div>Loading payment form...</div>
    </template>
  </ClientOnly>
</template>
```

#### 4. Server API Route

Create `server/api/create-payment-intent.post.ts`:

```ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: body.amount || 1000,
    currency: 'usd',
  })

  return {
    clientSecret: paymentIntent.client_secret
  }
})
```

::: tip Nuxt Auto-Imports
Nuxt auto-imports Vue functions like `ref`, `onMounted`, etc. You don't need to import them manually.
:::

---

### Vue CLI / Webpack

For projects using Vue CLI or Webpack-based setups.

#### 1. Environment Variables

Create a `.env.local` file:

```env
VUE_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

#### 2. Usage

```vue
<script setup>
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement />
    </StripeElements>
  </StripeProvider>
</template>
```

---

### Vue 2 + Vite

Vue Stripe supports Vue 2 via `vue-demi`. Works with Vue 2.7+ out of the box.

#### 1. Install Dependencies

```bash
pnpm add @vue-stripe/vue-stripe @stripe/stripe-js
```

#### 2. Usage (Options API)

```vue
<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement @change="onChange" />
    </StripeElements>
  </StripeProvider>
</template>

<script>
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'

export default {
  components: {
    StripeProvider,
    StripeElements,
    StripePaymentElement
  },
  data() {
    return {
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      clientSecret: ''
    }
  },
  methods: {
    onChange(event) {
      console.log('Payment element changed:', event)
    }
  }
}
</script>
```

#### 3. Usage (Composition API with Vue 2.7)

Vue 2.7 includes the Composition API, so you can use `<script setup>`:

```vue
<script setup>
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement
} from '@vue-stripe/vue-stripe'
import { ref } from 'vue'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
</script>

<template>
  <StripeProvider :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement />
    </StripeElements>
  </StripeProvider>
</template>
```

---

### Quasar Framework

Quasar works with both Vite and Webpack modes.

#### 1. Vite Mode (Recommended)

Same as standard Vite setup. Add to `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

#### 2. Webpack Mode

Add to `quasar.config.js`:

```js
build: {
  env: {
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY
  }
}
```

Access via:

```js
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY
```

#### 3. SSR Mode

For Quasar SSR, wrap Stripe components in `<q-no-ssr>`:

```vue
<template>
  <q-no-ssr>
    <StripeProvider :publishable-key="publishableKey">
      <StripeElements :client-secret="clientSecret">
        <StripePaymentElement />
      </StripeElements>
    </StripeProvider>
  </q-no-ssr>
</template>
```

---

### Laravel + Inertia.js

For Laravel applications using Inertia.js with Vue.

#### 1. Environment Variables

Add to your `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

#### 2. Create PaymentIntent (Laravel Controller)

```php
// app/Http/Controllers/PaymentController.php
use Stripe\Stripe;
use Stripe\PaymentIntent;

class PaymentController extends Controller
{
    public function createIntent(Request $request)
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $intent = PaymentIntent::create([
            'amount' => $request->amount,
            'currency' => 'usd',
        ]);

        return response()->json([
            'clientSecret' => $intent->client_secret
        ]);
    }
}
```

#### 3. Vue Component

```vue
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import {
  StripeProvider,
  StripeElements,
  StripePaymentElement,
  usePaymentIntent
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = ref('')
const loading = ref(true)

onMounted(async () => {
  const { data } = await axios.post('/api/payment/create-intent', {
    amount: 1000
  })
  clientSecret.value = data.clientSecret
  loading.value = false
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <StripeProvider v-else :publishable-key="publishableKey">
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement />
      <button @click="handlePay">Pay Now</button>
    </StripeElements>
  </StripeProvider>
</template>
```

---

### Static Site Generators (VitePress, VuePress)

For documentation sites or static builds that need payment forms.

#### VitePress

Since VitePress renders at build time, use dynamic imports:

```vue
<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'

const StripeProvider = defineAsyncComponent(() =>
  import('@vue-stripe/vue-stripe').then(m => m.StripeProvider)
)
const StripeElements = defineAsyncComponent(() =>
  import('@vue-stripe/vue-stripe').then(m => m.StripeElements)
)

const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})
</script>

<template>
  <div v-if="isClient">
    <StripeProvider :publishable-key="publishableKey">
      <!-- Payment components -->
    </StripeProvider>
  </div>
</template>
```

---

## Plugin Registration (Optional)

For simpler imports, register Vue Stripe as a global plugin:

```js
// main.js or main.ts
import { createApp } from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import App from './App.vue'

const app = createApp(App)

app.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}))

app.mount('#app')
```

Then use without importing in components:

```vue
<template>
  <!-- Components available globally -->
  <StripeProvider>
    <StripeElements :client-secret="clientSecret">
      <StripePaymentElement />
    </StripeElements>
  </StripeProvider>
</template>
```

---

## Verify Installation

Create a simple test to verify everything is working:

```vue
<script setup>
import { StripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const onLoad = (stripe) => {
  console.log('Stripe loaded!', stripe)
}

const onError = (error) => {
  console.error('Stripe failed to load:', error)
}
</script>

<template>
  <StripeProvider
    :publishable-key="publishableKey"
    @load="onLoad"
    @error="onError"
  >
    <template #loading>
      <p>Loading Stripe...</p>
    </template>
    <template #error="{ message }">
      <p>Error: {{ message }}</p>
    </template>
    <p>✅ Stripe is ready!</p>
  </StripeProvider>
</template>
```

If you see "✅ Stripe is ready!" and the console shows "Stripe loaded!", you're good to go!

---

## SSR Considerations

Stripe.js is a client-side only library. For SSR frameworks:

| Framework | Solution |
|-----------|----------|
| Nuxt 3 | Use `.client.vue` suffix or `<ClientOnly>` |
| Quasar SSR | Use `<q-no-ssr>` wrapper |
| VitePress | Use `defineAsyncComponent` + `onMounted` check |
| Custom SSR | Check `typeof window !== 'undefined'` before rendering |

::: warning Hydration Mismatch
If you see hydration mismatch warnings, ensure Stripe components only render on the client side using the techniques above.
:::

---

## Troubleshooting

### "Stripe is not defined"

Make sure you're importing from `@vue-stripe/vue-stripe`, not `@stripe/stripe-js` directly:

```js
// ✅ Correct
import { StripeProvider } from '@vue-stripe/vue-stripe'

// ❌ Wrong - This is the raw Stripe.js library
import { loadStripe } from '@stripe/stripe-js'
```

### "Invalid publishable key"

- Check your key starts with `pk_test_` (test mode) or `pk_live_` (live mode)
- Verify there are no extra spaces or newlines in your environment variable
- Make sure you're using the publishable key, not the secret key

### Components not rendering

- Ensure `StripeProvider` is the outermost wrapper
- Check that `StripeElements` has a valid `clientSecret` prop (required for most elements)
- Look for errors in the browser console

### TypeScript errors

If you see type errors, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["@stripe/stripe-js"]
  }
}
```

---

## Next Steps

Now that you have Vue Stripe installed, let's [build your first payment form](/guide/first-payment).
