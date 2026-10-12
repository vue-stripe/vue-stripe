<script setup lang="ts">
// useCreateToken with a Card Element: stripe.createToken(cardElement, data).
import { ref } from 'vue'
import { VueStripeCardElement, useCreateToken } from '@vue-stripe/vue-stripe'
import { Button } from '@/components/ui'

const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const { createToken, loading, error } = useCreateToken()
const result = ref<string | null>(null)

const onCreate = async () => {
  result.value = null
  const card = cardRef.value?.element
  if (!card) return
  const { token } = await createToken(card, { name: 'Jenny Rosen' })
  if (token) result.value = `Created ${token.id} (${token.card?.brand} ending ${token.card?.last4})`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-card rounded-lg p-4 border">
      <VueStripeCardElement ref="cardRef" data-test="token-card" />
    </div>
    <Button :disabled="loading" data-test="create-token" @click="onCreate">
      {{ loading ? 'Creating...' : 'Create Token' }}
    </Button>
    <code v-if="result" class="block text-sm p-3 rounded bg-secondary" data-test="token-result">{{
      result
    }}</code>
    <code v-if="error" class="block text-sm p-3 rounded bg-secondary" data-test="token-error"
      >Error: {{ error }}</code
    >
  </div>
</template>
