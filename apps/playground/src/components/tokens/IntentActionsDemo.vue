<script setup lang="ts">
// The client-secret based composables: useHandleCardAction,
// useVerifyMicrodepositsForPayment / ForSetup and useEphemeralKeyNonce.
import { ref } from 'vue'
import {
  useHandleCardAction,
  useVerifyMicrodepositsForPayment,
  useVerifyMicrodepositsForSetup,
  useEphemeralKeyNonce
} from '@vue-stripe/vue-stripe'
import { Button, Input, Label } from '@/components/ui'

const clientSecret = ref('')
const amounts = ref('32,45')
const descriptorCode = ref('SM11AA')
const issuingCard = ref('')
const results = ref<string[]>([])

const cardAction = useHandleCardAction()
const forPayment = useVerifyMicrodepositsForPayment()
const forSetup = useVerifyMicrodepositsForSetup()
const nonce = useEphemeralKeyNonce()

type Outcome = {
  paymentIntent?: { id: string; status: string } | undefined
  setupIntent?: { id: string; status: string } | undefined
  nonce?: string | undefined
  error?: { message?: string | undefined } | undefined
}
const describe = (name: string, outcome: Outcome) => {
  const intent = outcome.paymentIntent ?? outcome.setupIntent
  if (outcome.error) return `${name}: error: ${outcome.error.message}`
  return intent ? `${name}: ${intent.id} is ${intent.status}` : `${name}: nonce ${outcome.nonce}`
}
const parseAmounts = () => amounts.value.split(',').map((n) => Number(n.trim()))

// Newest result first.
const run = async (name: string, call: () => Promise<Outcome>) => {
  try {
    results.value.unshift(describe(name, await call()))
  } catch (err) {
    results.value.unshift(`${name}: threw ${err instanceof Error ? err.message : String(err)}`)
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <Label for="ia-secret">PaymentIntent / SetupIntent client secret</Label>
      <Input id="ia-secret" v-model="clientSecret" placeholder="pi_..._secret_... or seti_..." />
    </div>
    <div class="flex flex-wrap gap-2">
      <Button
        :disabled="cardAction.loading.value"
        data-test="handle-card-action"
        @click="run('handleCardAction', () => cardAction.handleCardAction(clientSecret))"
      >
        handleCardAction
      </Button>
    </div>
    <div class="flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-2">
        <Label for="ia-amounts">Micro-deposit amounts (cents)</Label>
        <Input id="ia-amounts" v-model="amounts" class="w-32" />
      </div>
      <Button
        :disabled="forPayment.loading.value"
        data-test="verify-payment"
        @click="
          run('verifyMicrodepositsForPayment', () =>
            forPayment.verifyMicrodepositsForPayment(clientSecret, { amounts: parseAmounts() })
          )
        "
      >
        verifyMicrodepositsForPayment
      </Button>
    </div>
    <div class="flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-2">
        <Label for="ia-code">Descriptor code</Label>
        <Input id="ia-code" v-model="descriptorCode" class="w-32" />
      </div>
      <Button
        :disabled="forSetup.loading.value"
        data-test="verify-setup"
        @click="
          run('verifyMicrodepositsForSetup', () =>
            forSetup.verifyMicrodepositsForSetup(clientSecret, { descriptor_code: descriptorCode })
          )
        "
      >
        verifyMicrodepositsForSetup
      </Button>
    </div>
    <div class="flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-2">
        <Label for="ia-card">Issuing card</Label>
        <Input id="ia-card" v-model="issuingCard" class="w-64" placeholder="ic_..." />
      </div>
      <Button
        :disabled="nonce.loading.value"
        data-test="ephemeral-key-nonce"
        @click="
          run('createEphemeralKeyNonce', () =>
            nonce.createEphemeralKeyNonce({ issuingCard: issuingCard })
          )
        "
      >
        createEphemeralKeyNonce
      </Button>
    </div>
    <ol v-if="results.length" class="flex flex-col gap-2" data-test="intent-results">
      <li v-for="(line, i) in results" :key="results.length - i">
        <code class="block text-sm p-3 rounded bg-secondary">{{ line }}</code>
      </li>
    </ol>
  </div>
</template>
