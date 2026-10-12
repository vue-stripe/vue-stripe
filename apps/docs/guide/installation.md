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

::: tip Requirements
Vue Stripe 6 requires `@stripe/stripe-js` `^10.0.0` (Stripe.js Endive) and **Vue 2.7 or Vue 3**. Vue 2.6 is not supported (it is end-of-life and lacks the APIs the components use). Upgrading from v5? See [Migrating from v5](/guide/migration-v6).
:::

### Import the stylesheet

The components ship their styles as a separate file. Import it once, e.g. in `main.ts`:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Every element renders `.vue-stripe-element` with `-mount`, `-error` and `-loader` parts, next to its own `.vue-stripe-<type>-element` classes, so you can restyle all elements at once or one at a time.

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

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

#### 2. Basic Usage

```vue
<script setup>
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement />
    </VueStripeElements>
  </VueStripeProvider>
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

### Vue 2.7

Vue Stripe runs on Vue 2.7 through [vue-demi](https://github.com/vueuse/vue-demi). Every component is a plain `defineComponent` render function, so templates, `h()` and the Options API all work.

```bash
npm install @vue-stripe/vue-stripe @stripe/stripe-js vue@^2.7
```

vue-demi picks the Vue 2.7 build in its `postinstall` script. **pnpm 10+ does not run dependency build scripts by default**, so allow vue-demi's (or switch it manually):

::: code-group
```json [pnpm 10 (package.json)]
{
  "pnpm": {
    "onlyBuiltDependencies": ["vue-demi"]
  }
}
```

```yaml [pnpm 11+ (pnpm-workspace.yaml)]
allowBuilds:
  vue-demi: true
```

```bash [any package manager]
npx vue-demi-switch 2.7
```
:::

```js
// main.js
import Vue from 'vue'
import App from './App.vue'
import '@vue-stripe/vue-stripe/style.css'

// <stripe-pricing-table> is Stripe's web component, not a Vue component.
Vue.config.ignoredElements = ['stripe-pricing-table']

new Vue({ render: (h) => h(App) }).$mount('#app')
```

```vue
<script>
import { VueStripeProvider, VueStripeElements, VueStripeCardElement } from '@vue-stripe/vue-stripe'

export default {
  components: { VueStripeProvider, VueStripeElements, VueStripeCardElement },
  data: () => ({
    publishableKey: process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY,
    clientSecret: '',
    complete: false
  }),
  methods: {
    onChange(event) {
      this.complete = event.complete
    }
  }
}
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripeCardElement @change="onChange" />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

::: info Tested on Vue 2.7
The `Vue 2.7 compatibility` CI job mounts the published bundle on Vue 2.7.16 for every change.
:::

### Nuxt 3

Nuxt 3 requires special handling for client-side only components since Stripe.js cannot run on the server.

#### 1. Environment Variables

Add to your `.env` file:

```bash
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
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const config = useRuntimeConfig()
const publishableKey = config.public.stripePublishableKey

defineProps<{
  clientSecret: string
}>()
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <slot />
    </VueStripeElements>
  </VueStripeProvider>
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
      <VueStripePaymentElement @change="onChange" />
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

```bash
VUE_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

#### 2. Usage

```vue
<script setup>
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'

const publishableKey = process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY
</script>

<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement />
    </VueStripeElements>
  </VueStripeProvider>
</template>
```

---

### Quasar Framework

Quasar works with both Vite and Webpack modes.

#### 1. Vite Mode (Recommended)

Same as standard Vite setup. Add to `.env`:

```bash
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
    <VueStripeProvider :publishable-key="publishableKey">
      <VueStripeElements :client-secret="clientSecret">
        <VueStripePaymentElement />
      </VueStripeElements>
    </VueStripeProvider>
  </q-no-ssr>
</template>
```

---

### Laravel + Inertia.js

For Laravel applications using Inertia.js with Vue.

#### 1. Environment Variables

Add to your `.env`:

```bash
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
  VueStripeProvider,
  VueStripeElements,
  VueStripePaymentElement,
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
  <VueStripeProvider v-else :publishable-key="publishableKey">
    <VueStripeElements :client-secret="clientSecret">
      <VueStripePaymentElement />
      <button @click="handlePay">Pay Now</button>
    </VueStripeElements>
  </VueStripeProvider>
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
  import('@vue-stripe/vue-stripe').then(m => m.VueStripeProvider)
)
const StripeElements = defineAsyncComponent(() =>
  import('@vue-stripe/vue-stripe').then(m => m.VueStripeElements)
)

const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})
</script>

<template>
  <div v-if="isClient">
    <VueStripeProvider :publishable-key="publishableKey">
      <!-- Payment components -->
    </VueStripeProvider>
  </div>
</template>
```

---

## Plugin Registration (Optional)

Instead of wrapping your tree in `<VueStripeProvider>`, you can install the plugin once. It provides Stripe to the whole app, so elements and composables work without a provider:

::: code-group

```js [Vue 3]
// main.js or main.ts
import { createApp } from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createVueStripe({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}))

app.mount('#app')
```

```js [Vue 2.7]
// main.js
import Vue from 'vue'
import { createVueStripe } from '@vue-stripe/vue-stripe'
import '@vue-stripe/vue-stripe/style.css'
import App from './App.vue'

Vue.use(createVueStripe({
  publishableKey: process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY
}))

new Vue({ render: (h) => h(App) }).$mount('#app')
```

:::

```vue
<script setup>
// Components are still imported where you use them
import { VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'
</script>

<template>
  <!-- No VueStripeProvider needed: the plugin provides the Stripe instance -->
  <VueStripeElements :client-secret="clientSecret">
    <VueStripePaymentElement />
  </VueStripeElements>
</template>
```

::: info What the plugin does and does not do
- Stripe.js loads once, the first time a component or composable needs it, and never on the server.
- A `<VueStripeProvider>` inside the app still wins for its own subtree, e.g. for a connected account or `betas`.
- The plugin does **not** register components globally; import each component where you use it.

See [createVueStripe](/api/plugin) for the full reference.
:::

---

## Verify Installation

Create a simple test to verify everything is working:

```vue
<script setup>
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const onLoad = (stripe) => {
  console.log('Stripe loaded!', stripe)
}

const onError = (error) => {
  console.error('Stripe failed to load:', error)
}
</script>

<template>
  <VueStripeProvider
    :publishable-key="publishableKey"
    @load="onLoad"
    @error="onError"
  >
    <template #loading>
      <p>Loading Stripe...</p>
    </template>
    <template #error="{ error }">
      <p>Error: {{ error }}</p>
    </template>
    <p>Stripe is ready!</p>
  </VueStripeProvider>
</template>
```

If you see "Stripe is ready!" and the console shows "Stripe loaded!", you're good to go!

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
// Correct
import { VueStripeProvider } from '@vue-stripe/vue-stripe'

// Wrong - This is the raw Stripe.js library
import { loadStripe } from '@stripe/stripe-js'
```

### "Invalid publishable key"

- Check your key starts with `pk_test_` (test mode) or `pk_live_` (live mode)
- Verify there are no extra spaces or newlines in your environment variable
- Make sure you're using the publishable key, not the secret key

### Components not rendering

- Ensure `VueStripeProvider` is the outermost wrapper
- Check that `VueStripeElements` has a valid `clientSecret`, or `mode` / `currency` / `amount` when you have no Intent yet (most elements need one of them)
- Make sure the stylesheet is imported once: `import '@vue-stripe/vue-stripe/style.css'`
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
