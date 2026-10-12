<script setup lang="ts">
// useCreateConfirmationToken with a deferred Payment Element: no arguments, so it
// uses the injected Elements and runs elements.submit() before
// stripe.createConfirmationToken({ elements, params }).
import { ref } from 'vue'
import { VueStripePaymentElement, useCreateConfirmationToken } from '@vue-stripe/vue-stripe'
import { Button } from '@/components/ui'

const { createConfirmationToken, loading, error } = useCreateConfirmationToken()
const result = ref<string | null>(null)

const onCreate = async () => {
  result.value = null
  const { confirmationToken } = await createConfirmationToken({
    params: { return_url: window.location.href }
  })
  if (confirmationToken) {
    const preview = confirmationToken.payment_method_preview
    result.value = `Created ${confirmationToken.id} (${preview.type}, ${preview.card?.brand ?? ''} ending ${preview.card?.last4 ?? ''})`
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-card rounded-lg p-4 border">
      <VueStripePaymentElement data-test="ctoken-payment-element" />
    </div>
    <Button :disabled="loading" data-test="create-ctoken" @click="onCreate">
      {{ loading ? 'Creating...' : 'Create ConfirmationToken' }}
    </Button>
    <code v-if="result" class="block text-sm p-3 rounded bg-secondary" data-test="ctoken-result">{{
      result
    }}</code>
    <code v-if="error" class="block text-sm p-3 rounded bg-secondary" data-test="ctoken-error"
      >Error: {{ error }}</code
    >
  </div>
</template>
