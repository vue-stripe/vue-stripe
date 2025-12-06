<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeLinkAuthenticationElement
} from '@vue-stripe/vue-stripe'
import type { StripeLinkAuthenticationElementChangeEvent } from '@stripe/stripe-js'
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
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui'

// Ref to the link auth element component
const linkAuthRef = ref<InstanceType<typeof VueStripeLinkAuthenticationElement> | null>(null)

const stripeConfig = inject<{
  publishableKey: string
  clientSecret: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Local client secret state (separate from global config)
const localClientSecret = ref('')
const clientSecret = computed(() => localClientSecret.value.trim())
const showSecretForm = computed(() => publishableKey.value && !clientSecret.value)

// Default email for pre-filling
const useDefaultEmail = ref(false)
const defaultEmail = 'test@example.com'

// Element key to force remount when options change
const elementKey = ref(0)

// Collected link auth data
const authData = ref<{
  complete: boolean
  value: { email: string } | null
}>({
  complete: false,
  value: null
})

// Watch for option changes and remount
watch([useDefaultEmail], () => {
  elementKey.value++
  authData.value = { complete: false, value: null }
})

// Computed options for the element
const elementOptions = computed(() => {
  if (useDefaultEmail.value) {
    return {
      defaultValues: {
        email: defaultEmail
      }
    }
  }

  return {}
})

// Event log
const eventLog = ref<Array<{ time: string; event: string; data: string | undefined }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, event, data })
  if (eventLog.value.length > 15) {
    eventLog.value.pop()
  }
}

// Event handlers
const onReady = () => {
  logEvent('ready', 'Link Authentication Element mounted')
}

const onChange = (event: StripeLinkAuthenticationElementChangeEvent) => {
  authData.value = {
    complete: event.complete,
    value: event.value
  }

  if (event.complete) {
    logEvent('change', `complete: true, email: ${event.value.email}`)
  } else {
    logEvent('change', `complete: false`)
  }
}

// Call focus on the element
const handleFocus = () => {
  linkAuthRef.value?.focus()
  logEvent('focus() called')
}

// Call blur on the element
const handleBlur = () => {
  linkAuthRef.value?.blur()
  logEvent('blur() called')
}

// Call clear on the element
const handleClear = () => {
  linkAuthRef.value?.clear()
  authData.value = { complete: false, value: null }
  logEvent('clear() called')
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>StripeLinkAuthenticationElement</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Stripe's Link Authentication Element collects the customer's email address and
          authenticates them for Stripe Link, enabling a faster checkout experience.
        </p>
        <p class="text-sm mb-4">
          <a href="https://vuestripe.com" target="_blank" class="text-primary hover:underline">
            View full documentation →
          </a>
        </p>

        <!-- Warning if no publishable key -->
        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this component.
          </AlertDescription>
        </Alert>

        <!-- Client Secret Form -->
        <div v-else-if="showSecretForm" class="bg-secondary rounded-lg p-5 mt-4">
          <h4 class="font-semibold mb-2">Enter Client Secret</h4>
          <p class="text-muted-foreground text-sm mb-4">The Link Authentication Element requires a <code>clientSecret</code> from a PaymentIntent.</p>

          <div class="mb-4">
            <Label class="mb-2">Client Secret</Label>
            <Input
              v-model="localClientSecret"
              type="text"
              placeholder="pi_xxx_secret_xxx"
              class="font-mono"
            />
          </div>

          <div class="bg-card rounded-md border p-4 mt-4">
            <h5 class="font-medium text-sm mb-2">How to get a Client Secret:</h5>
            <ol class="text-muted-foreground text-sm space-y-2 pl-5 list-decimal">
              <li>Go to <a href="https://dashboard.stripe.com/test/payments" target="_blank" class="text-primary hover:underline">Stripe Dashboard → Payments</a></li>
              <li>Click <strong>"+ Create"</strong> → <strong>"Create payment"</strong></li>
              <li>Enter an amount (e.g., $10.00)</li>
              <li>Copy the <code>client_secret</code> from the response</li>
            </ol>
            <p class="text-muted-foreground text-sm mt-2">
              The client secret looks like: <code>pi_xxx_secret_xxx</code>
            </p>
          </div>
        </div>

        <!-- Configuration Controls -->
        <div v-if="publishableKey && clientSecret" class="mt-4">
          <h4 class="font-semibold mb-3">Configuration</h4>

          <div class="p-4 bg-secondary rounded-lg">
            <div class="space-y-3">
              <Label class="text-xs uppercase tracking-wide text-muted-foreground">Pre-fill Email</Label>
              <Tabs :model-value="useDefaultEmail ? 'prefill' : 'empty'" @update:model-value="useDefaultEmail = $event === 'prefill'" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="empty">Empty</TabsTrigger>
                  <TabsTrigger value="prefill">test@example.com</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo -->
    <Card v-if="publishableKey && clientSecret">
      <CardHeader>
        <CardTitle class="text-lg">Live Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground text-sm mb-4">
          Enter an email address. If the email is associated with a Stripe Link account,
          the user can authenticate for faster checkout.
        </p>

        <!-- Show current secret and allow clearing -->
        <div class="flex items-center gap-3 p-3 bg-secondary rounded-md flex-wrap mb-4">
          <span class="text-sm text-muted-foreground">Client Secret:</span>
          <code class="font-mono text-xs bg-card px-2 py-0.5 rounded">{{ clientSecret.slice(0, 15) }}...{{ clientSecret.slice(-8) }}</code>
          <Button size="sm" variant="ghost" @click="localClientSecret = ''" title="Clear and enter new secret">
            Clear
          </Button>
        </div>

        <div class="bg-secondary rounded-lg p-6">
          <VueStripeProvider :publishable-key="publishableKey">
            <VueStripeElements :client-secret="clientSecret">
              <!-- Email / Link Authentication -->
              <div class="bg-card rounded-md p-4 border">
                <Label class="mb-2">Email</Label>
                <VueStripeLinkAuthenticationElement
                  ref="linkAuthRef"
                  :key="elementKey"
                  :options="elementOptions"
                  @ready="onReady"
                  @change="onChange"
                />
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3 mt-4 flex-wrap">
                <Button variant="secondary" @click="handleFocus">Focus</Button>
                <Button variant="secondary" @click="handleBlur">Blur</Button>
                <Button variant="secondary" @click="handleClear">Clear</Button>
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>

        <!-- Collected Data Display -->
        <div class="bg-secondary rounded-lg p-4 mt-4">
          <h4 class="font-semibold text-sm mb-3">Collected Data</h4>
          <div class="flex gap-2 mb-3">
            <Badge :variant="authData.complete ? 'success' : 'warning'">
              {{ authData.complete ? '✅ Complete' : '⏳ Incomplete' }}
            </Badge>
          </div>

          <div v-if="authData.value" class="bg-card rounded-md p-3 border text-sm">
            <div class="flex gap-2 py-1">
              <span class="text-muted-foreground min-w-[60px]">Email:</span>
              <span class="font-medium">{{ authData.value.email }}</span>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground text-sm py-4">
            Enter an email address to see collected data here.
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
          <div v-if="eventLog.length === 0" class="text-muted-foreground italic">
            Interact with the Link Authentication Element to see events...
          </div>
          <div v-for="(entry, index) in eventLog" :key="index" class="flex gap-3 py-1 text-sm">
            <span class="text-muted-foreground">{{ entry.time }}</span>
            <span class="font-medium text-primary">{{ entry.event }}</span>
            <span v-if="entry.data" class="text-muted-foreground">{{ entry.data }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>
