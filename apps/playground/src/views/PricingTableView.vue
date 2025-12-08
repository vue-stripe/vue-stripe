<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripePricingTable
} from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Input,
  Label,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui'

const stripeConfig = inject<{
  publishableKey: string
}>('stripeConfig')

const publishableKey = computed(() => stripeConfig?.publishableKey || '')

// Pricing Table configuration
const pricingTableId = ref('')
const customerEmail = ref('')
const clientReferenceId = ref('')

// Component state
const isTableLoaded = ref(false)
const tableError = ref<string | null>(null)

// Event log
const eventLog = ref<Array<{ time: string; event: string; data?: string }>>([])

const logEvent = (event: string, data?: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, event, data })
  if (eventLog.value.length > 15) {
    eventLog.value.pop()
  }
  console.info(`[PricingTable] ${event}:`, data)
}

// Event handlers
const onLoad = () => {
  isTableLoaded.value = true
  tableError.value = null
  logEvent('load', 'Pricing table script loaded successfully')
}

const onError = (error: Error) => {
  tableError.value = error.message
  logEvent('error', error.message)
}

// Computed: Is form valid?
const isFormValid = computed(() => {
  return pricingTableId.value.startsWith('prctbl_')
})
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <!-- Header Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-3">
          VueStripePricingTable
          <Badge variant="info">v5.3.0</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          Embed a subscription pricing table configured in your Stripe Dashboard.
          No backend code required - just provide the pricing table ID.
        </p>
        <p class="text-sm mb-4">
          <a href="https://dashboard.stripe.com/test/pricing-tables" target="_blank" class="text-primary hover:underline">
            Create a Pricing Table in Stripe Dashboard →
          </a>
        </p>

        <!-- Warning if no publishable key -->
        <Alert v-if="!publishableKey" variant="warning">
          <AlertDescription>
            Add your Stripe publishable key using the header button to test this component.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <!-- API Reference Card -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Props & Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prop / Event</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell class="font-mono text-sm">pricingTableId</TableCell>
              <TableCell class="text-muted-foreground">string</TableCell>
              <TableCell><Badge variant="destructive">Yes</Badge></TableCell>
              <TableCell>Pricing table ID from Stripe Dashboard (starts with prctbl_)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-mono text-sm">customerEmail</TableCell>
              <TableCell class="text-muted-foreground">string</TableCell>
              <TableCell><Badge variant="secondary">No</Badge></TableCell>
              <TableCell>Pre-fill customer email in checkout</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-mono text-sm">customerSessionClientSecret</TableCell>
              <TableCell class="text-muted-foreground">string</TableCell>
              <TableCell><Badge variant="secondary">No</Badge></TableCell>
              <TableCell>For existing customers (from Customer Session API)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-mono text-sm">clientReferenceId</TableCell>
              <TableCell class="text-muted-foreground">string</TableCell>
              <TableCell><Badge variant="secondary">No</Badge></TableCell>
              <TableCell>Reference ID for fulfillment reconciliation</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-mono text-sm">@load</TableCell>
              <TableCell class="text-muted-foreground">() => void</TableCell>
              <TableCell><Badge variant="secondary">Event</Badge></TableCell>
              <TableCell>Emitted when pricing table script loads</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="font-mono text-sm">@error</TableCell>
              <TableCell class="text-muted-foreground">(error: Error) => void</TableCell>
              <TableCell><Badge variant="secondary">Event</Badge></TableCell>
              <TableCell>Emitted when script fails to load</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Configuration Card -->
    <Card v-if="publishableKey">
      <CardHeader>
        <CardTitle class="text-lg">Configuration</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label class="mb-2">Pricing Table ID *</Label>
          <Input
            v-model="pricingTableId"
            type="text"
            placeholder="prctbl_..."
            class="font-mono"
            :class="{ 'border-success': isFormValid }"
          />
          <p class="text-xs text-muted-foreground mt-1">
            Find this in Stripe Dashboard → Product Catalog → Pricing tables
          </p>
        </div>

        <div>
          <Label class="mb-2">Customer Email (optional)</Label>
          <Input
            v-model="customerEmail"
            type="email"
            placeholder="customer@example.com"
          />
          <p class="text-xs text-muted-foreground mt-1">
            Pre-fills the email field in checkout
          </p>
        </div>

        <div>
          <Label class="mb-2">Client Reference ID (optional)</Label>
          <Input
            v-model="clientReferenceId"
            type="text"
            placeholder="user_123"
          />
          <p class="text-xs text-muted-foreground mt-1">
            Use for reconciling subscriptions with your internal systems
          </p>
        </div>

        <!-- How to create pricing table -->
        <div class="bg-card rounded-md border p-4 mt-4">
          <h5 class="font-medium text-sm mb-2">How to create a Pricing Table:</h5>
          <ol class="text-muted-foreground text-sm space-y-2 pl-5 list-decimal">
            <li>Go to <a href="https://dashboard.stripe.com/test/pricing-tables" target="_blank" class="text-primary hover:underline">Stripe Dashboard → Pricing tables</a></li>
            <li>Click "Create pricing table"</li>
            <li>Add your products and configure the appearance</li>
            <li>Copy the <code>pricing-table-id</code> from the embed code</li>
          </ol>
        </div>
      </CardContent>
    </Card>

    <!-- Live Demo Card -->
    <Card v-if="publishableKey && isFormValid">
      <CardHeader>
        <CardTitle class="text-lg">Live Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="border rounded-lg p-4 bg-background min-h-[400px]">
          <VueStripeProvider :publishable-key="publishableKey">
            <VueStripePricingTable
              :pricing-table-id="pricingTableId"
              :customer-email="customerEmail || undefined"
              :client-reference-id="clientReferenceId || undefined"
              @load="onLoad"
              @error="onError"
            >
              <template #loading>
                <div class="flex items-center justify-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span class="ml-3 text-muted-foreground">Loading pricing table...</span>
                </div>
              </template>
              <template #error="{ error }">
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to load pricing table: {{ error }}
                  </AlertDescription>
                </Alert>
              </template>
            </VueStripePricingTable>
          </VueStripeProvider>
        </div>

        <!-- Status display -->
        <div class="mt-4 flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Status:</span>
          <Badge v-if="isTableLoaded" variant="success">Loaded</Badge>
          <Badge v-else-if="tableError" variant="destructive">Error</Badge>
          <Badge v-else variant="secondary">Loading...</Badge>
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
            Configure a pricing table ID to see events...
          </div>
          <div v-for="(entry, index) in eventLog" :key="index" class="flex gap-3 py-1 text-sm">
            <span class="text-muted-foreground">{{ entry.time }}</span>
            <span class="font-medium text-primary">{{ entry.event }}</span>
            <span v-if="entry.data" class="text-muted-foreground">{{ entry.data }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Learning Notes -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Key Insights</CardTitle>
      </CardHeader>
      <CardContent class="prose prose-sm max-w-none">
        <ul class="space-y-2 text-muted-foreground">
          <li>
            <strong class="text-foreground">No Backend Required:</strong>
            Pricing tables are configured entirely in the Stripe Dashboard.
          </li>
          <li>
            <strong class="text-foreground">Automatic Checkout:</strong>
            Clicking a price takes customers directly to Stripe Checkout.
          </li>
          <li>
            <strong class="text-foreground">Separate Script:</strong>
            Uses <code>pricing-table.js</code> instead of <code>@stripe/stripe-js</code>.
          </li>
          <li>
            <strong class="text-foreground">Provider Required:</strong>
            Must be wrapped in <code>VueStripeProvider</code> to get the publishable key.
          </li>
          <li>
            <strong class="text-foreground">Limitations:</strong>
            Max 4 products per pricing interval, no usage-based pricing support.
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
