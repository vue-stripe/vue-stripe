<script setup lang="ts">
// useFinancialConnections() demo: paste a client secret created on your server
import { ref } from 'vue'
import { useFinancialConnections } from '@vue-stripe/vue-stripe'
import { Alert, AlertDescription, Button, Input, Label } from '@/components/ui'

const {
  collectFinancialConnectionsAccounts,
  collectBankAccountToken,
  collectBankAccountForPayment,
  collectBankAccountForSetup,
  loading,
  error
} = useFinancialConnections()

const secret = ref('')
const name = ref('Jenny Rosen')
const email = ref('jenny@example.com')
const result = ref<string | null>(null)

const achParams = () => ({
  payment_method_type: 'us_bank_account' as const,
  payment_method_data: { billing_details: { name: name.value, email: email.value } }
})

const onAccounts = async () => {
  result.value = null
  const res = await collectFinancialConnectionsAccounts({ clientSecret: secret.value.trim() })
  if (res.financialConnectionsSession) {
    const accounts = res.financialConnectionsSession.accounts
    result.value = `${res.financialConnectionsSession.id}: ${accounts.length} account(s) linked`
  }
}

const onToken = async () => {
  result.value = null
  const res = await collectBankAccountToken({ clientSecret: secret.value.trim() })
  if (res.token) result.value = `Bank account token ${res.token.id}`
  // Stripe only issues a token when the session's account holder is a Custom connected account
  else if (res.financialConnectionsSession)
    result.value = 'No token (session not for a Connect account)'
}

const onPayment = async () => {
  result.value = null
  const res = await collectBankAccountForPayment({
    clientSecret: secret.value.trim(),
    params: achParams()
  })
  if (res.paymentIntent) {
    result.value = `${res.paymentIntent.id}: ${res.paymentIntent.status}`
  }
}

const onSetup = async () => {
  result.value = null
  const res = await collectBankAccountForSetup({
    clientSecret: secret.value.trim(),
    params: achParams()
  })
  if (res.setupIntent) result.value = `${res.setupIntent.id}: ${res.setupIntent.status}`
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Label class="text-sm">Client secret</Label>
    <Input
      v-model="secret"
      placeholder="fcsess_..._secret_..., pi_..._secret_... or seti_..._secret_..."
      data-test="fc-secret"
    />
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label class="text-sm mb-1 block">Account holder name (ACH)</Label>
        <Input v-model="name" data-test="fc-name" />
      </div>
      <div>
        <Label class="text-sm mb-1 block">Email (ACH)</Label>
        <Input v-model="email" data-test="fc-email" />
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button :disabled="loading || !secret.trim()" data-test="fc-accounts" @click="onAccounts">
        collectFinancialConnectionsAccounts
      </Button>
      <Button :disabled="loading || !secret.trim()" data-test="fc-token" @click="onToken">
        collectBankAccountToken
      </Button>
      <Button :disabled="loading || !secret.trim()" data-test="fc-payment" @click="onPayment">
        collectBankAccountForPayment
      </Button>
      <Button :disabled="loading || !secret.trim()" data-test="fc-setup" @click="onSetup">
        collectBankAccountForSetup
      </Button>
    </div>
    <p class="text-sm text-muted-foreground" data-test="fc-loading">loading: {{ loading }}</p>
    <code v-if="result" class="block text-sm p-3 rounded bg-secondary" data-test="fc-result">{{
      result
    }}</code>
    <Alert v-if="error" variant="destructive">
      <AlertDescription data-test="fc-error">{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>
