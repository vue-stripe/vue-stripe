<script setup lang="ts">
import { ref, inject, defineComponent, h } from 'vue'
import { VueStripeProvider, useStripe } from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui'

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
  console.info(`[useStripe Test] ${type}:`, message)
}

// Demo component that uses useStripe inside VueStripeProvider
const StripeConsumer = defineComponent({
  name: 'StripeConsumer',
  setup() {
    const { stripe, loading, error } = useStripe()

    return () => h('div', { class: 'bg-card rounded-lg p-5' }, [
      h('h4', { class: 'text-lg font-semibold mb-4' }, 'useStripe() Return Values'),
      h('div', { class: 'grid grid-cols-3 gap-4' }, [
        h('div', { class: 'bg-secondary rounded-lg p-4' }, [
          h('label', { class: 'block text-xs text-muted-foreground mb-1' }, 'stripe'),
          h('code', { class: 'text-sm' }, stripe.value ? '✅ Stripe instance' : 'null')
        ]),
        h('div', { class: 'bg-secondary rounded-lg p-4' }, [
          h('label', { class: 'block text-xs text-muted-foreground mb-1' }, 'loading'),
          h('code', { class: 'text-sm' }, String(loading.value))
        ]),
        h('div', { class: 'bg-secondary rounded-lg p-4' }, [
          h('label', { class: 'block text-xs text-muted-foreground mb-1' }, 'error'),
          h('code', { class: 'text-sm' }, error.value || 'null')
        ])
      ]),
      stripe.value ? h('div', { class: 'mt-5 pt-5 border-t' }, [
        h('h5', { class: 'font-semibold mb-3' }, 'Available Stripe Methods'),
        h('ul', { class: 'text-sm space-y-1 pl-5 list-disc text-muted-foreground' }, [
          h('li', [h('code', 'stripe.confirmPayment()')]),
          h('li', [h('code', 'stripe.confirmSetup()')]),
          h('li', [h('code', 'stripe.confirmCardPayment()')]),
          h('li', [h('code', 'stripe.elements()')]),
          h('li', [h('code', 'stripe.createToken()')]),
          h('li', [h('code', 'stripe.createPaymentMethod()')]),
          h('li', '...and more')
        ])
      ]) : null
    ])
  }
})

// Component that tries to use useStripe OUTSIDE provider (will throw)
const showOutsideError = ref(false)
const outsideError = ref<string | null>(null)

const testOutsideProvider = () => {
  try {
    // This would throw - we catch it for demo
    outsideError.value = 'useStripe must be called within a VueStripeProvider component'
    showOutsideError.value = true
    log('error', 'Attempted to use useStripe outside VueStripeProvider')
  } catch (e) {
    outsideError.value = e instanceof Error ? e.message : 'Unknown error'
    showOutsideError.value = true
  }
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>useStripe() Composable Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          A composable that provides access to the Stripe instance from any component
          inside a VueStripeProvider. Must be used within the StripeProvider hierarchy.
        </p>

        <div class="bg-secondary rounded-lg p-5 space-y-4">
          <h3 class="font-semibold">API Reference</h3>

          <div>
            <h4 class="font-medium mb-2">Usage</h4>
            <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { useStripe } from '@vue-stripe/vue-stripe'

// Must be inside a VueStripeProvider
const { stripe, loading, error } = useStripe()</code></pre>
          </div>

          <div>
            <h4 class="font-medium mb-2">Returns</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><code>stripe</code></TableCell>
                  <TableCell><code>Ref&lt;Stripe | null&gt;</code></TableCell>
                  <TableCell>The Stripe.js instance (null while loading)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code>loading</code></TableCell>
                  <TableCell><code>Ref&lt;boolean&gt;</code></TableCell>
                  <TableCell>True while Stripe.js is loading</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code>error</code></TableCell>
                  <TableCell><code>Ref&lt;string | null&gt;</code></TableCell>
                  <TableCell>Error message if loading failed</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h4 class="font-medium mb-2">Important Notes</h4>
            <ul class="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Must be called inside a component that is a descendant of VueStripeProvider</li>
              <li>Throws <code>VueStripeProviderError</code> if used outside VueStripeProvider</li>
              <li>All returned values are reactive refs</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo: Inside Provider -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">✅ Inside StripeProvider (Works)</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          The useStripe() composable is called inside a component wrapped by VueStripeProvider.
        </p>

        <Alert v-if="!stripeConfig?.publishableKey" variant="warning">
          <AlertDescription>
            No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
          </AlertDescription>
        </Alert>

        <div v-else class="bg-secondary rounded-lg p-6">
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <template #loading>
              <div class="text-center py-8">
                <div class="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p class="text-muted-foreground">Loading Stripe.js...</p>
              </div>
            </template>

            <StripeConsumer />
          </VueStripeProvider>
        </div>
      </CardContent>
    </Card>

    <!-- Demo: Outside Provider (Error) -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">❌ Outside StripeProvider (Throws Error)</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Calling useStripe() outside a VueStripeProvider will throw an error.
          This is caught and displayed below.
        </p>

        <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <Button
            v-if="!showOutsideError"
            variant="outline"
            @click="testOutsideProvider"
          >
            Try useStripe() Outside Provider
          </Button>

          <div v-else class="text-center">
            <span class="text-2xl block mb-2">🚨</span>
            <strong class="text-destructive block mb-3 text-lg">VueStripeProviderError</strong>
            <code class="block bg-destructive/10 py-3 px-4 rounded-lg mb-4 text-sm">{{ outsideError }}</code>
            <Button size="sm" variant="outline" @click="showOutsideError = false">
              Reset
            </Button>
          </div>
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
          <div v-if="events.length === 0" class="text-muted-foreground italic">
            No events yet. Click the button above to see error handling.
          </div>
          <div
            v-for="(event, index) in events"
            :key="index"
            class="flex gap-3 py-1"
          >
            <span class="text-muted-foreground">{{ event.time }}</span>
            <span :class="['font-semibold min-w-[60px]', event.type === 'error' ? 'text-destructive' : '']">{{ event.type }}</span>
            <span class="text-muted-foreground">{{ event.message }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Code Examples -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Code Examples</CardTitle>
      </CardHeader>
      <CardContent class="space-y-5">
        <div>
          <h4 class="font-medium mb-2">Basic Usage</h4>
          <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;script setup&gt;
import { useStripe } from '@vue-stripe/vue-stripe'

// Access Stripe instance from parent StripeProvider
const { stripe, loading, error } = useStripe()

// Use in a payment handler
const handlePayment = async () => {
  if (!stripe.value) return

  const result = await stripe.value.confirmPayment({
    elements,
    confirmParams: {
      return_url: 'https://example.com/success'
    }
  })

  if (result.error) {
    console.error(result.error.message)
  }
}
&lt;/script&gt;</code></pre>
        </div>

        <div>
          <h4 class="font-medium mb-2">Watching for Stripe Ready</h4>
          <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;script setup&gt;
import { watch } from 'vue'
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe, loading } = useStripe()

// React when Stripe becomes available
watch(stripe, (stripeInstance) => {
  if (stripeInstance) {
    console.log('Stripe is ready!')
    // Initialize your payment form
  }
})

// Or watch loading state
watch(loading, (isLoading) => {
  if (!isLoading) {
    console.log('Loading complete')
  }
})
&lt;/script&gt;</code></pre>
        </div>

        <div>
          <h4 class="font-medium mb-2">Conditional Rendering</h4>
          <pre class="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;template&gt;
  &lt;div v-if="loading"&gt;Loading Stripe...&lt;/div&gt;
  &lt;div v-else-if="error"&gt;Error: {{ error }}&lt;/div&gt;
  &lt;div v-else&gt;
    &lt;!-- Stripe is ready, show payment form --&gt;
    &lt;PaymentForm /&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { useStripe } from '@vue-stripe/vue-stripe'
const { stripe, loading, error } = useStripe()
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
        <ul class="space-y-2 text-muted-foreground">
          <li><strong>Context Requirement:</strong> Must be used inside VueStripeProvider - throws error otherwise.</li>
          <li><strong>Reactive Values:</strong> All returned values are Vue refs, so use <code>.value</code> in script.</li>
          <li><strong>Async Loading:</strong> <code>stripe</code> is null initially while Stripe.js loads.</li>
          <li><strong>Error Handling:</strong> Check <code>error</code> to handle failed Stripe.js loads.</li>
          <li><strong>Use Cases:</strong> Building custom payment forms, accessing Stripe methods directly.</li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
