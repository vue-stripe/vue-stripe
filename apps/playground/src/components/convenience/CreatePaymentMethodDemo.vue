<script setup lang="ts">
// Create Payment Method demo (uses a Card Element)
import { ref } from 'vue'
import { VueStripeCardElement, useCreatePaymentMethod } from '@vue-stripe/vue-stripe'
import { Alert, AlertDescription, Button } from '@/components/ui'

const { createPaymentMethod, loading, error } = useCreatePaymentMethod()
const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const result = ref<string | null>(null)

const onCreate = async () => {
  result.value = null
  const card = cardRef.value?.element
  const res = await createPaymentMethod(card ? { type: 'card', card } : {})
  result.value = res?.paymentMethod
    ? `Created ${res.paymentMethod.id}`
    : `Failed: ${res?.error?.message || 'failed'}`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-card rounded-lg p-4 border">
      <VueStripeCardElement ref="cardRef" />
    </div>
    <Button :disabled="loading" data-test="create-pm" @click="onCreate">
      {{ loading ? 'Creating…' : 'Create Payment Method' }}
    </Button>
    <code v-if="result" class="block text-sm p-3 rounded bg-secondary" data-test="pm-result">{{
      result
    }}</code>
    <Alert v-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>
