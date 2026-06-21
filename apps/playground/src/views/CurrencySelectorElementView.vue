<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import {
  VueStripeProvider,
  VueStripeCheckoutProvider,
  VueStripeCurrencySelectorElement
} from '@vue-stripe/vue-stripe'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')

// A Custom Checkout session client secret (cs_..._secret_...) created on your
// server with `ui_mode: 'custom'` and Adaptive Pricing enabled. Paste it here.
const checkoutSecret = ref('')
const cleanSecret = computed(() => checkoutSecret.value.trim())
const activeSecret = ref('')

const start = () => { activeSecret.value = cleanSecret.value }

const message = ref<string | null>(null)
const onReady = () => { message.value = '✅ currency selector ready' }
const onFocus = () => { message.value = 'focused' }
const onBlur = () => { message.value = 'blurred' }
const onEscape = () => { message.value = 'escape pressed' }
const onLoadError = (event: any) => { message.value = `❌ ${event?.error?.message ?? 'load error'}` }
</script>

<template>
  <div class="page">
    <h2>Currency Selector Element (Custom Checkout)</h2>
    <p class="desc">
      A Custom Checkout element that lets customers choose the currency they pay in. Requires a
      Checkout Session (<code>ui_mode: 'custom'</code>) with
      <a href="https://docs.stripe.com/payments/checkout/adaptive-pricing" target="_blank">Adaptive Pricing</a>
      enabled. Create the session on your server and paste its <code>client_secret</code> below.
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

      <VueStripeProvider v-else :publishable-key="stripeConfig.publishableKey">
        <VueStripeCheckoutProvider :client-secret="activeSecret">
          <template #loading><p>Initializing checkout…</p></template>
          <template #error="{ error }"><p class="err">{{ error }}</p></template>

          <div class="field">
            <label>Currency</label>
            <VueStripeCurrencySelectorElement
              data-test="currency-selector-element"
              @ready="onReady"
              @focus="onFocus"
              @blur="onBlur"
              @escape="onEscape"
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
