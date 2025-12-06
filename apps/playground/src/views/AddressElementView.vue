<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeAddressElement
} from '@vue-stripe/vue-stripe'
import type { StripeAddressElementChangeEvent } from '@stripe/stripe-js'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Label,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui'

// Ref to the address element component
const addressElementRef = ref<InstanceType<typeof VueStripeAddressElement> | null>(null)

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Address mode toggle
const addressMode = ref<'shipping' | 'billing'>('shipping')

// Autocomplete toggle
const autocompleteEnabled = ref(true)

// Default values for pre-filling
const useDefaultValues = ref(false)
const defaultValues = {
  name: 'John Doe',
  address: {
    line1: '123 Main Street',
    line2: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'US'
  }
}

// Collected address data
const addressData = ref<{
  complete: boolean
  isNewAddress: boolean
  value: {
    name?: string
    firstName?: string
    lastName?: string
    phone?: string
    address: {
      line1: string
      line2: string | null
      city: string
      state: string
      postal_code: string
      country: string
    }
  } | null
}>({
  complete: false,
  isNewAddress: true,
  value: null
})

// Element key to force remount when options change
const elementKey = ref(0)

// getValue result
const getValueResult = ref<{
  complete: boolean
  isNewAddress: boolean
  value: typeof addressData.value['value']
} | null>(null)
const getValueError = ref<string | null>(null)
const isGettingValue = ref(false)

// Watch for option changes and remount
watch([addressMode, autocompleteEnabled, useDefaultValues], () => {
  elementKey.value++
  addressData.value = { complete: false, isNewAddress: true, value: null }
  getValueResult.value = null
  getValueError.value = null
})

// Computed options for the element
const elementOptions = computed(() => {
  const options: any = {
    mode: addressMode.value,
    autocomplete: autocompleteEnabled.value ? { mode: 'automatic' } : { mode: 'disabled' },
    fields: {
      phone: 'always'
    },
    validation: {
      phone: {
        required: 'never'
      }
    }
  }

  if (useDefaultValues.value) {
    options.defaultValues = defaultValues
  }

  return options
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
  logEvent('ready', 'Address Element mounted')
}

const onChange = (event: StripeAddressElementChangeEvent) => {
  addressData.value = {
    complete: event.complete,
    isNewAddress: event.isNewAddress,
    value: event.value
  }

  if (event.complete) {
    logEvent('change', `complete: true, country: ${event.value.address.country}`)
  } else {
    logEvent('change', `complete: false`)
  }
}

const onFocus = () => logEvent('focus')
const onBlur = () => logEvent('blur')
const onEscape = () => logEvent('escape')
const onLoadError = (event: { elementType: 'address'; error: string }) => {
  logEvent('loaderror', event.error)
}

// Call getValue on the address element
const handleGetValue = async () => {
  if (!addressElementRef.value) {
    getValueError.value = 'Address element ref not available'
    logEvent('getValue error', 'ref not available')
    return
  }

  isGettingValue.value = true
  getValueError.value = null

  try {
    const result = await addressElementRef.value.getValue()
    getValueResult.value = result
    logEvent('getValue', `complete: ${result.complete}, isNewAddress: ${result.isNewAddress}`)
  } catch (err) {
    getValueError.value = err instanceof Error ? err.message : 'Unknown error'
    logEvent('getValue error', getValueError.value)
  } finally {
    isGettingValue.value = false
  }
}

// Call focus on the address element
const handleFocus = () => {
  addressElementRef.value?.focus()
  logEvent('focus() called')
}

// Call clear on the address element
const handleClear = () => {
  addressElementRef.value?.clear()
  getValueResult.value = null
  logEvent('clear() called')
}
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>StripeAddressElement</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Stripe's Address Element collects shipping or billing addresses with built-in
          autocomplete powered by Google Maps. Works without a clientSecret.
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

        <!-- Configuration Controls -->
        <div v-else class="mt-4">
          <h4 class="font-semibold mb-3">Configuration</h4>

          <div class="grid gap-6 p-4 bg-secondary rounded-lg" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
            <div class="space-y-3">
              <Label class="text-xs uppercase tracking-wide text-muted-foreground">Mode</Label>
              <Tabs v-model="addressMode" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div class="space-y-3">
              <Label class="text-xs uppercase tracking-wide text-muted-foreground">Autocomplete</Label>
              <Tabs :model-value="autocompleteEnabled ? 'enabled' : 'disabled'" @update:model-value="autocompleteEnabled = $event === 'enabled'" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="enabled">Enabled</TabsTrigger>
                  <TabsTrigger value="disabled">Disabled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div class="space-y-3">
              <Label class="text-xs uppercase tracking-wide text-muted-foreground">Pre-fill</Label>
              <Tabs :model-value="useDefaultValues ? 'prefill' : 'empty'" @update:model-value="useDefaultValues = $event === 'prefill'" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="empty">Empty</TabsTrigger>
                  <TabsTrigger value="prefill">With Data</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo -->
    <Card v-if="publishableKey">
      <CardHeader>
        <CardTitle class="text-lg">Live Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground text-sm mb-4">
          Try the address autocomplete. Start typing an address to see suggestions.
        </p>

        <div class="bg-secondary rounded-lg p-6">
          <VueStripeProvider :publishable-key="publishableKey">
            <VueStripeElements>
              <div class="bg-card rounded-md p-4 border">
                <VueStripeAddressElement
                  ref="addressElementRef"
                  :key="elementKey"
                  :options="elementOptions"
                  @ready="onReady"
                  @change="onChange"
                  @focus="onFocus"
                  @blur="onBlur"
                  @escape="onEscape"
                  @load-error="onLoadError"
                />
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3 mt-4 flex-wrap">
                <Button
                  :disabled="isGettingValue"
                  @click="handleGetValue"
                >
                  {{ isGettingValue ? 'Getting...' : 'Get Value' }}
                </Button>
                <Button variant="secondary" @click="handleFocus">Focus</Button>
                <Button variant="secondary" @click="handleClear">Clear</Button>
              </div>
            </VueStripeElements>
          </VueStripeProvider>
        </div>

        <!-- Collected Data Display -->
        <div class="bg-secondary rounded-lg p-4 mt-4">
          <h4 class="font-semibold text-sm mb-3">Collected Address Data</h4>
          <div class="flex gap-2 mb-3">
            <Badge :variant="addressData.complete ? 'success' : 'warning'">
              {{ addressData.complete ? '✅ Complete' : '⏳ Incomplete' }}
            </Badge>
            <Badge v-if="addressData.isNewAddress" variant="info">New Address</Badge>
          </div>

          <div v-if="addressData.value" class="bg-card rounded-md p-3 border text-sm space-y-2">
            <div v-if="addressData.value.name" class="flex gap-2 py-1 border-b">
              <span class="text-muted-foreground min-w-[80px]">Name:</span>
              <span class="font-medium">{{ addressData.value.name }}</span>
            </div>
            <div v-if="addressData.value.phone" class="flex gap-2 py-1 border-b">
              <span class="text-muted-foreground min-w-[80px]">Phone:</span>
              <span class="font-medium">{{ addressData.value.phone }}</span>
            </div>
            <div class="flex gap-2 py-1 border-b">
              <span class="text-muted-foreground min-w-[80px]">Address:</span>
              <span class="font-medium">
                {{ addressData.value.address.line1 }}
                <span v-if="addressData.value.address.line2">, {{ addressData.value.address.line2 }}</span>
              </span>
            </div>
            <div class="flex gap-2 py-1 border-b">
              <span class="text-muted-foreground min-w-[80px]">City/State:</span>
              <span class="font-medium">
                {{ addressData.value.address.city }}, {{ addressData.value.address.state }} {{ addressData.value.address.postal_code }}
              </span>
            </div>
            <div class="flex gap-2 py-1">
              <span class="text-muted-foreground min-w-[80px]">Country:</span>
              <span class="font-medium">{{ addressData.value.address.country }}</span>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground text-sm py-4">
            Fill in the address form to see collected data here.
          </div>
        </div>

        <!-- getValue() Result -->
        <div class="bg-secondary rounded-lg p-4 mt-4">
          <h4 class="font-semibold text-sm mb-2">getValue() Result</h4>
          <p class="text-muted-foreground text-sm mb-3">
            Click "Get Value" above to programmatically retrieve the current address data.
            This is useful for validation before form submission.
          </p>

          <Alert v-if="getValueError" variant="destructive">
            <AlertDescription>{{ getValueError }}</AlertDescription>
          </Alert>

          <div v-else-if="getValueResult" class="bg-card rounded-md p-3 border">
            <div class="flex gap-2 mb-3">
              <Badge :variant="getValueResult.complete ? 'success' : 'destructive'">
                {{ getValueResult.complete ? '✅ Valid' : '❌ Incomplete' }}
              </Badge>
              <Badge v-if="getValueResult.isNewAddress" variant="info">New Address</Badge>
            </div>

            <div class="bg-secondary rounded-md p-3 overflow-x-auto">
              <pre class="text-xs">{{ JSON.stringify(getValueResult, null, 2) }}</pre>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground text-sm py-4">
            Click "Get Value" to retrieve the current address data.
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
            Interact with the Address Element to see events...
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
