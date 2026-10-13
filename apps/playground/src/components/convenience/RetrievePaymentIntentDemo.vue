<script setup lang="ts">
// Retrieve Payment Intent demo
import { ref } from 'vue'
import { CircleCheck, CircleX } from 'lucide-vue-next'
import { usePaymentIntent } from '@vue-stripe/vue-stripe'
import { Button, Input } from '@/components/ui'

const { retrievePaymentIntent } = usePaymentIntent()
const secret = ref('')
const status = ref<{ ok: boolean; text: string } | null>(null)

const onRetrieve = async () => {
  status.value = null
  const res = await retrievePaymentIntent(secret.value.trim())
  status.value = res?.paymentIntent
    ? { ok: true, text: `${res.paymentIntent.id} — ${res.paymentIntent.status}` }
    : { ok: false, text: `Failed: ${res?.error?.message || 'failed'}` }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Input v-model="secret" placeholder="pi_xxx_secret_xxx" data-test="pi-secret" />
    <Button :disabled="!secret.trim()" data-test="retrieve-pi" @click="onRetrieve">
      Retrieve PaymentIntent
    </Button>
    <code
      v-if="status"
      class="flex items-center gap-2 text-sm p-3 rounded bg-secondary"
      data-test="pi-result"
      ><CircleCheck v-if="status.ok" class="size-4 shrink-0 text-success" /><CircleX
        v-else
        class="size-4 shrink-0 text-destructive"
      />{{ status.text }}</code
    >
  </div>
</template>
