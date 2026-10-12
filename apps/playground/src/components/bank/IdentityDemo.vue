<script setup lang="ts">
// useIdentity() demo: paste a VerificationSession client secret created on your server
import { ref } from 'vue'
import { useIdentity } from '@vue-stripe/vue-stripe'
import { Alert, AlertDescription, Button, Input, Label } from '@/components/ui'

const { verifyIdentity, loading, error } = useIdentity()
const secret = ref('')
const result = ref<string | null>(null)

const onVerify = async () => {
  result.value = null
  const res = await verifyIdentity(secret.value.trim())
  // Stripe.js resolves { error: null } on submit (no verificationSession, despite its types)
  if (!res.error) result.value = 'Verification submitted'
  else if ('code' in res.error) result.value = `Stopped: ${res.error.code}`
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Label class="text-sm">VerificationSession client secret</Label>
    <Input v-model="secret" placeholder="vs_..._secret_..." data-test="vs-secret" />
    <Button :disabled="loading || !secret.trim()" data-test="vs-verify" @click="onVerify">
      {{ loading ? 'Identity modal open' : 'verifyIdentity' }}
    </Button>
    <code v-if="result" class="block text-sm p-3 rounded bg-secondary" data-test="vs-result">{{
      result
    }}</code>
    <Alert v-if="error" variant="destructive">
      <AlertDescription data-test="vs-error">{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>
