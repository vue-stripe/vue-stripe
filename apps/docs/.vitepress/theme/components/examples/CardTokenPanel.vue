<script setup lang="ts">
// Rendered inside VueStripeElements so VueStripeCardElement can mount; useCreateToken
// only needs the Stripe instance from VueStripeProvider.
import { ref } from 'vue'
import { VueStripeCardElement, useCreateToken } from '@vue-stripe/vue-stripe'

const cardRef = ref<InstanceType<typeof VueStripeCardElement> | null>(null)
const { createToken, loading, error } = useCreateToken()

const ready = ref(false)
const complete = ref(false)
const result = ref<{ id: string; detail: string } | null>(null)

async function create() {
  const card = cardRef.value?.element
  if (!card) return
  result.value = null
  const { token } = await createToken(card, { name: 'Jenny Rosen' })
  if (!token) return
  result.value = {
    id: token.id,
    detail: token.card ? `${token.card.brand} ending ${token.card.last4}` : token.type
  }
}
</script>

<template>
  <div class="token-panel">
    <VueStripeCardElement
      ref="cardRef"
      @ready="ready = true"
      @change="(event) => (complete = event.complete)"
    />
    <button
      :class="['action-btn', { disabled: !ready || !complete || loading }]"
      :disabled="!ready || !complete || loading"
      data-test="create-token"
      @click="create"
    >
      {{ loading ? 'Creating...' : 'Create Token' }}
    </button>
    <dl v-if="result" class="result" data-test="token-result">
      <dt>Token</dt>
      <dd>
        <code>{{ result.id }}</code>
      </dd>
      <dt>Card</dt>
      <dd>{{ result.detail }}</dd>
    </dl>
    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>

<style scoped src="./token-panel.css"></style>
