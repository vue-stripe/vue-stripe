<script setup lang="ts">
import { createApp, ref, inject, defineComponent, h } from 'vue'
import { VueStripeProvider, useStripe } from '@vue-stripe/vue-stripe'
import { CircleCheck, CircleX, Siren } from 'lucide-vue-next'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button
} from '@/components/ui'

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

// Event log for tracking what happens
const events = ref<{ time: string; type: string; message: string }[]>([])

const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString()
  events.value.unshift({ time, type, message })
}

// Stripe.js methods next to the library API that calls them for you.
const stripeWrappers = [
  ['stripe.confirmPayment()', 'usePaymentIntent().confirmPayment'],
  ['stripe.confirmSetup()', 'useSetupIntent().confirmSetup'],
  ['stripe.confirmCardPayment()', 'useConfirmCardPayment()'],
  ['stripe.elements()', '<VueStripeElements>'],
  ['stripe.createToken()', 'useCreateToken()'],
  ['stripe.createPaymentMethod()', 'useCreatePaymentMethod()'],
  ['stripe.confirm<Method>Payment() / Setup()', 'useConfirm<Method>Payment() / Setup()'],
  ['stripe.handleNextAction()', 'useHandleNextAction()']
] as const

// Demo component that uses useStripe inside VueStripeProvider
const StripeConsumer = defineComponent({
  name: 'StripeConsumer',
  setup() {
    const { stripe, loading, error } = useStripe()

    return () =>
      h('div', { class: 'bg-card rounded-lg p-5' }, [
        h('h4', { class: 'text-lg font-semibold mb-4' }, 'useStripe() Return Values'),
        h('div', { class: 'grid grid-cols-3 gap-4' }, [
          h('div', { class: 'bg-secondary rounded-lg p-4' }, [
            h('label', { class: 'block text-xs text-muted-foreground mb-1' }, 'stripe'),
            stripe.value
              ? h('code', { class: 'text-sm inline-flex items-center gap-1 text-success' }, [
                  h(CircleCheck, { class: 'size-4' }),
                  'Stripe instance'
                ])
              : h('code', { class: 'text-sm' }, 'null')
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
        stripe.value
          ? h('div', { class: 'mt-5 pt-5 border-t' }, [
              h('h5', { class: 'font-semibold mb-3' }, 'Library wrappers for Stripe methods'),
              h(
                'p',
                { class: 'text-sm text-muted-foreground mb-3' },
                'useStripe() is the escape hatch for anything the library does not wrap. Stripe.js methods it does wrap:'
              ),
              h(
                'ul',
                { class: 'text-sm space-y-1 pl-5 list-disc text-muted-foreground' },
                stripeWrappers.map(([method, wrapper]) =>
                  h('li', [h('code', method), ' via ', h('code', wrapper)])
                )
              )
            ])
          : null
      ])
  }
})

// Component that tries to use useStripe OUTSIDE provider (will throw)
const showOutsideError = ref(false)
const outsideError = ref<string | null>(null)

const testOutsideProvider = () => {
  try {
    // Call the real composable in the context of an app with no VueStripeProvider (and no
    // createVueStripe()), so it throws the library's VueStripeProviderError. Never mounted.
    createApp(() => null).runWithContext(useStripe)
    outsideError.value = 'useStripe() did not throw'
  } catch (e) {
    outsideError.value = e instanceof Error ? e.message : 'Unknown error'
    log('error', `Attempted to use useStripe outside VueStripeProvider: ${outsideError.value}`)
  }
  showOutsideError.value = true
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>useStripe() Composable</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          A composable that provides access to the Stripe instance from any component inside a
          VueStripeProvider. Must be used within the StripeProvider hierarchy.
        </p>
        <p class="text-sm">
          <a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline">
            View full documentation →
          </a>
        </p>
      </CardContent>
    </Card>

    <!-- Live Demo: Inside Provider -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <CircleCheck class="size-5 text-success" />
          Inside StripeProvider (Works)
        </CardTitle>
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
                <div
                  class="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
                ></div>
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
        <CardTitle class="text-lg flex items-center gap-2">
          <CircleX class="size-5 text-destructive" />
          Outside StripeProvider (Throws Error)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Calling useStripe() outside a VueStripeProvider will throw an error. This is caught and
          displayed below.
        </p>

        <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <Button v-if="!showOutsideError" variant="outline" @click="testOutsideProvider">
            Try useStripe() Outside Provider
          </Button>

          <div v-else class="text-center">
            <Siren class="size-6 mx-auto mb-2 text-destructive" />
            <strong class="text-destructive block mb-3 text-lg">VueStripeProviderError</strong>
            <code class="block bg-destructive/10 py-3 px-4 rounded-lg mb-4 text-sm">{{
              outsideError
            }}</code>
            <Button size="sm" variant="outline" @click="showOutsideError = false"> Reset </Button>
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
          <div v-for="(event, index) in events" :key="index" class="flex gap-3 py-1">
            <span class="text-muted-foreground">{{ event.time }}</span>
            <span
              :class="[
                'font-semibold min-w-[60px]',
                event.type === 'error' ? 'text-destructive' : ''
              ]"
              >{{ event.type }}</span
            >
            <span class="text-muted-foreground">{{ event.message }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
