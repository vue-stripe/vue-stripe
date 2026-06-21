<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeCheckoutProvider,
  VueStripeTaxIdElement
} from '@vue-stripe/vue-stripe'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')

// A Custom Checkout session client secret (cs_..._secret_...) created on your
// server with `ui_mode: 'custom'`. Paste it here for the demo.
const checkoutSecret = ref('')
const cleanSecret = computed(() => checkoutSecret.value.trim())
const activeSecret = ref('')

const start = () => { activeSecret.value = cleanSecret.value }

// Optionally also collect a business name alongside the tax ID.
const taxIdOptions = { fields: { businessName: 'auto' } }

const message = ref<string | null>(null)
const complete = ref(false)

const onReady = () => { message.value = '✅ tax ID ready' }
const onChange = (event: any) => {
  complete.value = !!event?.complete
  message.value = `complete: ${complete.value} · taxId: ${event?.value?.taxId ?? '—'}`
}
const onFocus = () => { message.value = 'focused' }
const onBlur = () => { message.value = 'blurred' }
const onEscape = () => { message.value = 'escape pressed' }
const onLoadStart = () => { message.value = 'loading…' }
const onLoadError = (event: any) => { message.value = `❌ ${event?.error?.message ?? 'load error'}` }
</script>

<template>
  <div class="page">
    <h2>Tax ID Element (Custom Checkout)</h2>
    <p class="desc">
      A Custom Checkout element that collects and validates a customer's tax ID (EU VAT, GST, ABN, …).
      Requires a Checkout Session (<code>ui_mode: 'custom'</code>). Create the session on your server and
      paste its <code>client_secret</code> below.
    </p>

    <div v-if="!stripeConfig?.publishableKey" class="warn">
      No Stripe key configured — click <strong>"Add Stripe Key"</strong> in the header.
    </div>

    <template v-else>
      <div v-if="!activeSecret" class="secret-form">
        <label>Checkout Session client secret</label>
        <input v-model="checkoutSecret" placeholder="cs_test_..._secret_..." />
        <button :disabled="!cleanSecret" @click="start">Start Checkout</button>
      </div>

      <!-- The Tax ID element is beta-gated: Stripe must be initialized with the
           `custom_checkout_tax_id_1` beta flag for `createTaxIdElement` to exist. -->
      <VueStripeProvider
        v-else
        :publishable-key="stripeConfig.publishableKey"
        :betas="['custom_checkout_tax_id_1']"
      >
        <VueStripeCheckoutProvider :client-secret="activeSecret">
          <template #loading><p>Initializing checkout…</p></template>
          <template #error="{ error }"><p class="err">{{ error }}</p></template>

          <div class="field">
            <label>Tax ID</label>
            <VueStripeTaxIdElement
              data-test="tax-id-element"
              :options="taxIdOptions"
              @ready="onReady"
              @change="onChange"
              @focus="onFocus"
              @blur="onBlur"
              @escape="onEscape"
              @loaderstart="onLoadStart"
              @loaderror="onLoadError"
            />
          </div>

          <p v-if="message" class="msg" data-test="result">{{ message }}</p>
        </VueStripeCheckoutProvider>
      </VueStripeProvider>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 560px; margin: 32px auto; padding: 16px; }
.desc { color: #666; margin-bottom: 20px; }
.warn { background: #fff3cd; padding: 12px; border-radius: 6px; }
.secret-form { display: flex; flex-direction: column; gap: 10px; }
.secret-form input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-family: monospace; }
.field { margin-bottom: 16px; }
.field label { display: block; margin-bottom: 8px; font-weight: 500; }
button { background: #635bff; color: #fff; border: none; padding: 10px 14px; border-radius: 6px; cursor: pointer; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.msg { padding: 10px; background: #f0f7ff; border-radius: 6px; }
.err { color: #dc3545; }
</style>
