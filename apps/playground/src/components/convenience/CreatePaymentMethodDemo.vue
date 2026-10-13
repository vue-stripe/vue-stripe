<script setup lang="ts">
// Create Payment Method demo (uses a Card Element)
import { ref } from 'vue'
import { CircleCheck, CircleX } from 'lucide-vue-next'
import { VueStripeCardElement, useCreatePaymentMethod } from '@vue-stripe/vue-stripe'
import { Alert, AlertDescription, Button } from '@/components/ui'

const { createPaymentMethod, loading, error } = useCreatePaymentMethod()
const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const result = ref<{ ok: boolean; text: string } | null>(null)

const onCreate = async () => {
  result.value = null
  const card = cardRef.value?.element
  const res = await createPaymentMethod(card ? { type: 'card', card } : {})
  result.value = res?.paymentMethod
    ? { ok: true, text: `Created ${res.paymentMethod.id}` }
    : { ok: false, text: `Failed: ${res?.error?.message || 'failed'}` }
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
    <code
      v-if="result"
      class="flex items-center gap-2 text-sm p-3 rounded bg-secondary"
      data-test="pm-result"
      ><CircleCheck v-if="result.ok" class="size-4 shrink-0 text-success" /><CircleX
        v-else
        class="size-4 shrink-0 text-destructive"
      />{{ result.text }}</code
    >
    <Alert v-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>
