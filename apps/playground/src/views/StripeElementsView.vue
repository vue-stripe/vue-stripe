<script setup lang="ts">
import { ref, inject, defineComponent, h, computed } from 'vue'
import { VueStripeProvider, VueStripeElements, useStripeElements } from '@vue-stripe/vue-stripe'
import type { StripeElements as StripeElementsType } from '@stripe/stripe-js'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui'

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
  console.info(`[StripeElements Test] ${type}:`, message)
}

// State for testing different scenarios
const testScenario = ref<'basic' | 'with-options' | 'appearance' | 'dark-theme'>('basic')

// Mock client secret (in real app, this comes from your backend)
const clientSecret = ref<string>('')
const showClientSecretInput = ref(true)

// Validate client secret format
const clientSecretStatus = computed(() => {
  if (!clientSecret.value) {
    return { valid: false, type: 'none', message: 'No client secret provided (optional for CardElement)' }
  }

  const value = clientSecret.value.trim()

  if (value.startsWith('pi_') && value.includes('_secret_')) {
    return { valid: true, type: 'payment_intent', message: 'Valid PaymentIntent client secret' }
  }

  if (value.startsWith('seti_') && value.includes('_secret_')) {
    return { valid: true, type: 'setup_intent', message: 'Valid SetupIntent client secret' }
  }

  return { valid: false, type: 'invalid', message: 'Invalid format. Expected pi_xxx_secret_xxx or seti_xxx_secret_xxx' }
})

// Computed for clean client secret value
const cleanClientSecret = computed(() => clientSecret.value.trim() || undefined)

// Child component that uses useStripeElements to verify provide/inject works
const ElementsConsumer = defineComponent({
  name: 'ElementsConsumer',
  props: {
    clientSecret: String
  },
  setup(props) {
    const { elements, loading, error } = useStripeElements()

    return () => h('div', { class: 'mt-5 p-4 bg-secondary rounded-lg text-left text-sm' }, [
      h('h4', { class: 'mt-0 mb-3 text-base font-semibold' }, 'useStripeElements() Status'),
      h('ul', { class: 'mb-3 pl-5 list-disc' }, [
        h('li', { class: 'mb-2' }, [h('strong', 'loading: '), String(loading.value)]),
        h('li', { class: 'mb-2' }, [h('strong', 'error: '), error.value || 'null']),
        h('li', { class: 'mb-2' }, [
          h('strong', 'elements: '),
          elements.value ? '✅ StripeElements instance available' : '❌ null'
        ]),
        h('li', { class: 'mb-2' }, [
          h('strong', 'clientSecret: '),
          props.clientSecret
            ? h('span', { class: 'text-success' }, ['✅ Provided (', props.clientSecret.slice(0, 10), '...)'])
            : h('span', { class: 'text-muted-foreground' }, '⚪ Not provided')
        ])
      ]),
      props.clientSecret
        ? h('p', { class: 'mt-3 p-3 rounded-md text-sm bg-success/10 text-success' }, '→ PaymentElement can be used')
        : h('p', { class: 'mt-3 p-3 rounded-md text-sm bg-info/10 text-info' }, '→ CardElement can be used (no clientSecret needed)')
    ])
  }
})

// Appearance options for customization demo
const appearanceOptions = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0570de',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '4px'
  }
}

const darkAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#7c3aed'
  }
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>StripeElements Component Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-6">
          Creates a Stripe Elements instance and provides it to child element components.
          Must be used within a StripeProvider.
        </p>

        <div class="border-t pt-6 space-y-4">
          <h3 class="font-semibold">API Reference</h3>
          <div>
            <h4 class="text-sm font-medium mb-2">Props</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prop</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><code class="text-sm bg-muted px-1 rounded">clientSecret</code></TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>No*</TableCell>
                  <TableCell>Client secret from PaymentIntent or SetupIntent</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code class="text-sm bg-muted px-1 rounded">options</code></TableCell>
                  <TableCell>object</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>Elements configuration (appearance, fonts, locale)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p class="text-sm text-muted-foreground mt-2">* Required for Payment Element. Optional for Card Element.</p>
          </div>

          <div>
            <h4 class="text-sm font-medium mb-2">Slots</h4>
            <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><code class="bg-muted px-1 rounded">#default</code> - Content shown when Elements is ready</li>
              <li><code class="bg-muted px-1 rounded">#loading</code> - Custom loading indicator</li>
              <li><code class="bg-muted px-1 rounded">#error="{ error }"</code> - Custom error display</li>
            </ul>
          </div>

          <div>
            <h4 class="text-sm font-medium mb-2">Provides (via useStripeElements)</h4>
            <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><code class="bg-muted px-1 rounded">elements</code> - Ref&lt;StripeElements | null&gt;</li>
              <li><code class="bg-muted px-1 rounded">loading</code> - Ref&lt;boolean&gt;</li>
              <li><code class="bg-muted px-1 rounded">error</code> - Ref&lt;string | null&gt;</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Test Scenario Selector -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Test Scenarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <Label class="text-xs uppercase tracking-wide text-muted-foreground">Scenario</Label>
          <Tabs v-model="testScenario" class="w-full">
            <TabsList class="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="with-options">With Options</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="dark-theme">Dark Theme</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>

    <!-- Client Secret Input (optional) -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Client Secret (Optional)</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground mb-4">
          For Payment Element, you need a clientSecret from a PaymentIntent.
          For Card Element, clientSecret is not required on StripeElements.
        </p>

        <div class="bg-info/10 border border-info/20 rounded-lg p-5 mb-5">
          <h4 class="mt-0 mb-4 text-base text-info font-medium">How to get a Client Secret:</h4>
          <ol class="m-0 pl-5 text-sm list-decimal space-y-3">
            <li>
              <strong>Stripe Dashboard (easiest):</strong>
              <a href="https://dashboard.stripe.com/test/payments" target="_blank" class="text-primary hover:underline">Dashboard → Payments</a>
              → Click <strong>+ Create</strong> → Set amount → Create → Copy the <code class="bg-muted px-1 rounded">client_secret</code> from the response
            </li>
            <li>
              <strong>Stripe CLI:</strong>
              <code class="block mt-1 bg-slate-900 text-green-400 px-2 py-1 rounded text-xs font-mono">stripe payment_intents create --amount=1000 --currency=usd</code>
            </li>
            <li>
              <strong>Your Backend API:</strong>
              Create a PaymentIntent via <code class="bg-muted px-1 rounded">stripe.paymentIntents.create()</code> and return the <code class="bg-muted px-1 rounded">client_secret</code>
            </li>
          </ol>
        </div>

        <div class="flex gap-3">
          <Input
            v-model="clientSecret"
            type="text"
            placeholder="pi_xxx_secret_xxx (optional)"
            :class="{
              'border-success': clientSecretStatus.valid,
              'border-destructive': clientSecretStatus.type === 'invalid'
            }"
            class="flex-1 font-mono text-sm"
          />
          <Button variant="secondary" size="sm" @click="clientSecret = ''">Clear</Button>
        </div>
        <div
          class="mt-3 p-3 rounded-md text-sm"
          :class="{
            'bg-success/10 text-success': clientSecretStatus.valid,
            'bg-destructive/10 text-destructive': clientSecretStatus.type === 'invalid',
            'bg-secondary text-muted-foreground': clientSecretStatus.type === 'none'
          }"
        >
          {{ clientSecretStatus.valid ? '✅ ' : clientSecretStatus.type === 'invalid' ? '❌ ' : '' }}{{ clientSecretStatus.message }}
          <span v-if="clientSecretStatus.valid" class="font-medium ml-1">
            ({{ clientSecretStatus.type === 'payment_intent' ? 'PaymentIntent' : 'SetupIntent' }})
          </span>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Live Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert v-if="!stripeConfig?.publishableKey" variant="warning">
          <AlertDescription>
            No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
          </AlertDescription>
        </Alert>

        <!-- Basic scenario -->
        <div v-else-if="testScenario === 'basic'" class="bg-secondary rounded-lg p-6">
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements :client-secret="cleanClientSecret">
              <template #loading>
                <div class="text-center py-8">
                  <div class="w-12 h-12 border-3 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p class="text-muted-foreground">Initializing Stripe Elements...</p>
                </div>
              </template>

              <template #error="{ error }">
                <div class="text-center py-5 text-destructive">
                  <span class="text-2xl">❌</span>
                  <p>{{ error }}</p>
                </div>
              </template>

              <div class="text-center py-8 bg-card rounded-lg shadow-sm">
                <span class="text-4xl mb-4 block">✅</span>
                <strong class="block text-lg mb-2">StripeElements Ready!</strong>
                <p class="text-muted-foreground">The Elements instance is now available to child components.</p>
                <component :is="ElementsConsumer" :client-secret="cleanClientSecret" />
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>

        <!-- With options -->
        <div v-else-if="testScenario === 'with-options'" class="bg-secondary rounded-lg p-6">
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements
              :client-secret="cleanClientSecret"
              :options="{ locale: 'en' }"
            >
              <template #loading>
                <div class="text-center py-8">
                  <div class="w-12 h-12 border-3 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p class="text-muted-foreground">Initializing with options...</p>
                </div>
              </template>

              <div class="text-center py-8 bg-card rounded-lg shadow-sm">
                <span class="text-4xl mb-4 block">✅</span>
                <strong class="block text-lg mb-2">StripeElements with Options</strong>
                <p class="text-muted-foreground">Initialized with <code class="bg-muted px-1 rounded">locale: 'en'</code></p>
                <component :is="ElementsConsumer" :client-secret="cleanClientSecret" />
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>

        <!-- Custom appearance -->
        <div v-else-if="testScenario === 'appearance'" class="bg-secondary rounded-lg p-6">
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements
              :client-secret="cleanClientSecret"
              :options="{ appearance: appearanceOptions }"
            >
              <div class="text-center py-8 bg-card rounded-lg shadow-sm">
                <span class="text-4xl mb-4 block">🎨</span>
                <strong class="block text-lg mb-2">Custom Appearance</strong>
                <p class="text-muted-foreground">Using the Stripe Appearance API for styling.</p>
                <pre class="bg-secondary p-3 rounded-md text-xs text-left overflow-x-auto mt-3">{{ JSON.stringify(appearanceOptions, null, 2) }}</pre>
                <component :is="ElementsConsumer" :client-secret="cleanClientSecret" />
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>

        <!-- Dark theme -->
        <div v-else-if="testScenario === 'dark-theme'" class="bg-slate-900 text-slate-100 rounded-lg p-6">
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements
              :client-secret="cleanClientSecret"
              :options="{ appearance: darkAppearance }"
            >
              <div class="text-center py-8 bg-slate-800 rounded-lg shadow-sm">
                <span class="text-4xl mb-4 block">🌙</span>
                <strong class="block text-lg mb-2">Dark Theme</strong>
                <p class="text-slate-400">Using <code class="bg-slate-700 px-1 rounded">theme: 'night'</code> with custom primary color.</p>
                <component :is="ElementsConsumer" :client-secret="cleanClientSecret" />
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>
      </CardContent>
    </Card>

    <!-- Event Log -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="event-log">
          <div v-if="events.length === 0" class="text-slate-400 text-center py-4 italic">
            No events yet. StripeElements doesn't emit events directly -
            use useStripeElements() to access state.
          </div>
          <div
            v-for="(event, index) in events"
            :key="index"
            class="event-entry"
          >
            <span class="event-time">{{ event.time }}</span>
            <span :class="['event-type', event.type]">{{ event.type }}</span>
            <span class="event-data">{{ event.message }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Code Examples -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Code Examples</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <h4 class="text-sm font-medium mb-2">Basic Usage</h4>
          <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm"><code>&lt;template&gt;
  &lt;StripeProvider :publishable-key="publishableKey"&gt;
    &lt;StripeElements :client-secret="clientSecret"&gt;
      &lt;StripePaymentElement /&gt;
    &lt;/StripeElements&gt;
  &lt;/StripeProvider&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { VueStripeProvider, VueStripeElements, VueStripePaymentElement } from '@vue-stripe/vue-stripe'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const clientSecret = 'pi_xxx_secret_xxx' // From your backend
&lt;/script&gt;</code></pre>
        </div>

        <div>
          <h4 class="text-sm font-medium mb-2">With Appearance Customization</h4>
          <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm"><code>&lt;StripeElements
  :client-secret="clientSecret"
  :options="{
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        borderRadius: '8px'
      },
      rules: {
        '.Input': {
          border: '1px solid #e6e6e6'
        }
      }
    }
  }"
&gt;
  &lt;StripePaymentElement /&gt;
&lt;/StripeElements&gt;</code></pre>
        </div>

        <div>
          <h4 class="text-sm font-medium mb-2">Card Element (No clientSecret)</h4>
          <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm"><code>&lt;!-- Card Element doesn't require clientSecret on StripeElements --&gt;
&lt;StripeProvider :publishable-key="publishableKey"&gt;
  &lt;StripeElements&gt;
    &lt;StripeCardElement /&gt;
  &lt;/StripeElements&gt;
&lt;/StripeProvider&gt;</code></pre>
        </div>

        <div>
          <h4 class="text-sm font-medium mb-2">Using useStripeElements</h4>
          <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm"><code>&lt;script setup&gt;
import { useStripeElements } from '@vue-stripe/vue-stripe'

// Must be used within VueStripeElements
const { elements, loading, error } = useStripeElements()

// Access the Elements instance
if (elements.value) {
  // Create individual elements, get element by type, etc.
  const paymentElement = elements.value.getElement('payment')
}
&lt;/script&gt;</code></pre>
        </div>
      </CardContent>
    </Card>

    <!-- Learning Notes -->
    <Card class="bg-gradient-to-br from-info/10 to-info/5 border-l-4 border-info">
      <CardHeader>
        <CardTitle class="text-lg text-info">Learning Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="list-disc list-inside space-y-2 text-sm">
          <li><strong>Hierarchy:</strong> StripeElements must be used within StripeProvider.</li>
          <li><strong>clientSecret:</strong> Required for PaymentElement, optional for CardElement.</li>
          <li><strong>Appearance API:</strong> Customize all Elements with themes, variables, and rules.</li>
          <li><strong>Provide/Inject:</strong> Child components access the Elements instance via useStripeElements().</li>
          <li><strong>Reactivity:</strong> When clientSecret changes, Elements is recreated automatically.</li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
