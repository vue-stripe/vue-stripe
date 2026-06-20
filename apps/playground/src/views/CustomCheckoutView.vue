<script setup lang="ts">
import { ref, inject, computed, defineComponent, h, watch, onBeforeUnmount } from 'vue'
import {
  VueStripeProvider,
  VueStripeCheckoutProvider,
  useCheckoutSession
} from '@vue-stripe/vue-stripe'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')

// A Custom Checkout session client secret (cs_..._secret_...) created on your
// server with `ui_mode: 'custom'`. Paste it here for the demo.
const checkoutSecret = ref('')
const cleanSecret = computed(() => checkoutSecret.value.trim())
const activeSecret = ref('')

const start = () => { activeSecret.value = cleanSecret.value }

// Child rendered inside the provider — drives the session via useCheckoutSession.
const CheckoutDemo = defineComponent({
  name: 'CheckoutDemo',
  setup() {
    const { checkout, session, confirm, updateEmail, applyPromotionCode, loading, error } = useCheckoutSession()
    const paymentMountRef = ref<HTMLDivElement>()
    const email = ref('')
    const promo = ref('')
    const message = ref<string | null>(null)
    let paymentElement: { mount: (el: HTMLElement) => void; destroy: () => void } | null = null

    // Mount the Payment Element created from the checkout instance.
    watch([checkout, paymentMountRef], ([c, el]) => {
      if (c && el && !paymentElement) {
        paymentElement = (c as any).createPaymentElement()
        paymentElement!.mount(el)
      }
    }, { immediate: true })

    onBeforeUnmount(() => { paymentElement?.destroy() })

    const onUpdateEmail = async () => {
      const res: any = await updateEmail(email.value)
      message.value = res?.type === 'error' ? `❌ ${res.error.message}` : '✅ email updated'
    }
    const onApplyPromo = async () => {
      const res: any = await applyPromotionCode(promo.value)
      message.value = res?.type === 'error' ? `❌ ${res.error.message}` : '✅ promotion applied'
    }
    const onConfirm = async () => {
      message.value = null
      const res: any = await confirm({ returnUrl: `${window.location.origin}/custom-checkout` })
      message.value = res?.type === 'error' ? `❌ ${res.error.message}` : `✅ ${res.session?.status?.type ?? 'confirmed'}`
    }

    return () => h('div', { class: 'demo' }, [
      h('div', { class: 'state', 'data-test': 'session-state' }, [
        h('h4', 'Session'),
        h('ul', [
          h('li', [h('strong', 'status: '), session.value?.status?.type ?? '—']),
          h('li', [h('strong', 'total: '), session.value?.total?.total?.amount ?? '—']),
          h('li', [h('strong', 'email: '), session.value?.email ?? '—']),
          h('li', [h('strong', 'canConfirm: '), String(session.value?.canConfirm ?? false)])
        ])
      ]),
      h('div', { class: 'pe' }, [h('label', 'Payment Element'), h('div', { ref: paymentMountRef, 'data-test': 'payment-element' })]),
      h('div', { class: 'row' }, [
        h('input', { value: email.value, placeholder: 'customer@email.com', onInput: (e: any) => (email.value = e.target.value) }),
        h('button', { onClick: onUpdateEmail }, 'Update email')
      ]),
      h('div', { class: 'row' }, [
        h('input', { value: promo.value, placeholder: 'PROMO CODE', onInput: (e: any) => (promo.value = e.target.value) }),
        h('button', { onClick: onApplyPromo }, 'Apply promo')
      ]),
      h('button', { class: 'pay', disabled: loading.value, onClick: onConfirm, 'data-test': 'confirm' }, 'Pay'),
      message.value ? h('p', { class: 'msg', 'data-test': 'result' }, message.value) : null,
      error.value ? h('p', { class: 'err' }, error.value) : null
    ])
  }
})
</script>

<template>
  <div class="page">
    <h2>Custom Checkout (useCheckoutSession)</h2>
    <p class="desc">
      Full UI control via a Checkout Session (<code>ui_mode: 'custom'</code>). Create the session on your
      server and paste its <code>client_secret</code> below.
    </p>

    <div v-if="!stripeConfig?.publishableKey" class="warn">
      No Stripe key configured — click <strong>"Add Key"</strong> in the header.
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
          <component :is="CheckoutDemo" />
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
.secret-form input, .row input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-family: monospace; }
.demo { display: flex; flex-direction: column; gap: 16px; }
.state ul { margin: 6px 0 0; padding-left: 18px; }
.row { display: flex; gap: 8px; }
.row input { flex: 1; }
button { background: #635bff; color: #fff; border: none; padding: 10px 14px; border-radius: 6px; cursor: pointer; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.pay { background: #0a8a00; }
.msg { padding: 10px; background: #f0f7ff; border-radius: 6px; }
.err { color: #dc3545; }
</style>
