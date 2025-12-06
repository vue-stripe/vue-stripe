<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import { VueStripeProvider } from '@vue-stripe/vue-stripe'
import type { Stripe } from '@stripe/stripe-js'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Label,
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
  console.info(`[StripeProvider Test] ${type}:`, message)
}

// Track load event
const onLoad = (stripe: Stripe) => {
  // Stripe instance is ready - you can now use it for payments
  // The stripe object has methods like confirmPayment, confirmSetup, etc.
  log('load', `Stripe.js loaded successfully! Instance ready for payments.`)
  console.info('[StripeProvider Test] Stripe instance:', stripe)
}

// Track error event
const onError = (error: Error) => {
  log('error', `Failed to load: ${error.message}`)
}

// State for testing different scenarios
const testScenario = ref<'normal' | 'custom-loading' | 'custom-error' | 'invalid-key'>('normal')
const showInvalidKey = ref(false)

// Watch testScenario to update showInvalidKey
watch(testScenario, (scenario) => {
  showInvalidKey.value = scenario === 'custom-error' || scenario === 'invalid-key'
})
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>StripeProvider Component Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          The root component that loads Stripe.js and provides the Stripe instance
          to all child components via Vue's provide/inject system.
        </p>
        <p class="text-sm">
          <a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline">
            View full documentation →
          </a>
        </p>
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
              <TabsTrigger value="normal">Normal</TabsTrigger>
              <TabsTrigger value="custom-loading">Custom Loading</TabsTrigger>
              <TabsTrigger value="custom-error">Custom Error</TabsTrigger>
              <TabsTrigger value="invalid-key">Invalid Key</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Live Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <!-- Normal scenario with valid key -->
        <div v-if="testScenario === 'normal' && stripeConfig?.publishableKey" class="bg-secondary rounded-lg p-6">
          <VueStripeProvider
            :publishable-key="stripeConfig.publishableKey"
            @load="onLoad"
            @error="onError"
          >
            <div class="text-center py-8 bg-card rounded-lg shadow-sm">
              <span class="text-4xl mb-4 block">✅</span>
              <strong class="block text-lg mb-2">Stripe Loaded Successfully!</strong>
              <p class="text-muted-foreground">The Stripe.js library has been loaded and is ready to use.</p>
              <p class="text-sm text-muted-foreground mt-4">Child components can now use useStripe() to access the Stripe instance.</p>
            </div>
          </VueStripeProvider>
        </div>

        <!-- Custom loading slot -->
        <div v-else-if="testScenario === 'custom-loading' && stripeConfig?.publishableKey" class="bg-secondary rounded-lg p-6">
          <VueStripeProvider
            :publishable-key="stripeConfig.publishableKey"
            @load="onLoad"
            @error="onError"
          >
            <template #loading>
              <div class="text-center py-8">
                <div class="w-12 h-12 border-3 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-muted-foreground">Custom loading message: Connecting to Stripe...</p>
              </div>
            </template>

            <div class="text-center py-8 bg-card rounded-lg shadow-sm">
              <span class="text-4xl mb-4 block">✅</span>
              <strong class="block text-lg">Stripe Ready (Custom Loading Used)</strong>
            </div>
          </VueStripeProvider>
        </div>

        <!-- Custom error slot with invalid key -->
        <div v-else-if="testScenario === 'custom-error'" class="bg-secondary rounded-lg p-6">
          <VueStripeProvider
            publishable-key="pk_test_invalid_key_12345"
            @load="onLoad"
            @error="onError"
          >
            <template #error="{ error }">
              <div class="text-center py-8 bg-destructive/10 rounded-lg">
                <span class="text-4xl mb-4 block">🚨</span>
                <strong class="block text-lg text-destructive mb-2">Custom Error Display</strong>
                <p class="text-muted-foreground mb-4">{{ error }}</p>
                <Button size="sm" @click="testScenario = 'normal'">
                  Try Again with Valid Key
                </Button>
              </div>
            </template>

            <div class="text-center">
              <strong>This won't show - key is invalid</strong>
            </div>
          </VueStripeProvider>
        </div>

        <!-- Invalid key (default error) -->
        <div v-else-if="testScenario === 'invalid-key'" class="bg-secondary rounded-lg p-6">
          <VueStripeProvider
            publishable-key="pk_test_invalid_key_12345"
            @load="onLoad"
            @error="onError"
          >
            <div class="text-center">
              <strong>This won't show - key is invalid</strong>
            </div>
          </VueStripeProvider>
        </div>

        <!-- No key configured -->
        <Alert v-else variant="warning">
          <AlertDescription>
            No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <!-- Event Log -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="event-log">
          <div v-if="events.length === 0" class="text-slate-400 text-center py-4">
            No events yet. Events will appear as they fire.
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
        <Button v-if="events.length > 0" variant="secondary" size="sm" class="mt-4" @click="events = []">
          Clear Log
        </Button>
      </CardContent>
    </Card>

  </div>
</template>
