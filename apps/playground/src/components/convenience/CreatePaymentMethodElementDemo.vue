<script setup lang="ts">
// Create Payment Method via the Payment Element (deferred, zero-arg).
// Exercises the auto-inject path: createPaymentMethod() with no args, which
// calls elements.submit() before stripe.createPaymentMethod({ elements }).
import { ref } from 'vue'
import { VueStripePaymentElement, useCreatePaymentMethod } from '@vue-stripe/vue-stripe'
import { Button } from '@/components/ui'

const { createPaymentMethod, loading } = useCreatePaymentMethod()
const result = ref<string | null>(null)

const onCreate = async () => {
  result.value = null
  const res = await createPaymentMethod() // zero-arg → Payment Element flow
  result.value = res?.paymentMethod
    ? `Created ${res.paymentMethod.id}`
    : `Failed: ${res?.error?.message || 'failed'}`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-card rounded-lg p-4 border">
      <VueStripePaymentElement />
    </div>
    <Button :disabled="loading" data-test="create-pm-element" @click="onCreate">
      {{ loading ? 'Creating…' : 'Create Payment Method' }}
    </Button>
    <code
      v-if="result"
      class="block text-sm p-3 rounded bg-secondary"
      data-test="pm-element-result"
      >{{ result }}</code
    >
  </div>
</template>
