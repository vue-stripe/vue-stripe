<script setup lang="ts">
// usePaymentRequest() demo: wallet check, show/update and the PaymentRequest events
import { computed, ref } from 'vue'
import { usePaymentRequest } from '@vue-stripe/vue-stripe'
import { Alert, AlertDescription, Badge, Button, Input, Label } from '@/components/ui'

const { paymentRequest, canMakePayment, loading, error, show, update, isShowing, on } =
  usePaymentRequest({
    country: 'US',
    currency: 'usd',
    total: { label: 'Vue Stripe demo', amount: 1099 },
    requestPayerName: true,
    requestPayerEmail: true
  })

const amount = ref(1099)
const log = ref<string[]>([])
const record = (line: string) => log.value.unshift(line)

on('paymentmethod', (event) => {
  // A real integration confirms a PaymentIntent with event.paymentMethod.id here.
  record(`paymentmethod: ${event.paymentMethod.id} (${event.walletName})`)
  event.complete('success')
})
on('cancel', () => record('cancel: payment interface closed'))

const status = computed(() => {
  if (loading.value) return { label: 'Checking for a wallet', variant: 'secondary' as const }
  if (canMakePayment.value) return { label: 'Wallet available', variant: 'success' as const }
  return { label: 'No wallet available', variant: 'warning' as const }
})

const pay = () => {
  update({ total: { label: 'Vue Stripe demo', amount: Number(amount.value) } })
  show()
  record(`show() called, isShowing: ${isShowing() ? 'yes' : 'no'}`)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <Badge :variant="status.variant" data-test="pr-status">{{ status.label }}</Badge>
      <span class="text-sm text-muted-foreground">
        PaymentRequest created:
        <strong data-test="pr-created">{{ paymentRequest ? 'Yes' : 'No' }}</strong>
      </span>
    </div>

    <div class="flex flex-col gap-1">
      <Label class="text-sm">canMakePayment</Label>
      <code class="block text-sm p-3 rounded bg-secondary" data-test="pr-can-make-payment">{{
        loading ? 'pending' : JSON.stringify(canMakePayment)
      }}</code>
    </div>

    <div class="flex flex-col gap-2">
      <Label class="text-sm">Amount in cents (sent with update() before show())</Label>
      <Input v-model="amount" type="number" min="50" data-test="pr-amount" />
    </div>

    <div class="flex flex-wrap gap-2">
      <Button :disabled="!canMakePayment" data-test="pr-pay" @click="pay">Pay with a wallet</Button>
      <Button variant="outline" :disabled="loading" data-test="pr-show-anyway" @click="pay">
        Call show() anyway
      </Button>
    </div>
    <p class="text-sm text-muted-foreground">
      Without a wallet, <code>show()</code> does not throw: the error Stripe.js raises lands on the
      <code>error</code> ref.
    </p>

    <Alert v-if="error" variant="destructive">
      <AlertDescription data-test="pr-error">{{ error }}</AlertDescription>
    </Alert>

    <div v-if="log.length" class="flex flex-col gap-1">
      <Label class="text-sm">Events</Label>
      <code class="block text-sm p-3 rounded bg-secondary whitespace-pre" data-test="pr-log">{{
        log.join('\n')
      }}</code>
    </div>
  </div>
</template>
