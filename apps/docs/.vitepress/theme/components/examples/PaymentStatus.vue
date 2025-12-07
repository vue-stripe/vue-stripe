<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vitepress'

const route = useRoute()
const router = useRouter()

const status = ref<'succeeded' | 'failed' | 'processing' | 'canceled' | null>(null)
const paymentIntentId = ref<string | null>(null)
const setupIntentId = ref<string | null>(null)
const message = ref<string | null>(null)
const visible = ref(false)

function parseQueryParams() {
  // VitePress route.query might not be immediately available
  const searchParams = new URLSearchParams(window.location.search)

  // Handle redirect_status from Stripe
  const redirectStatus = searchParams.get('redirect_status')
  if (redirectStatus) {
    status.value = redirectStatus as typeof status.value
    visible.value = true
  }

  // Handle payment_intent from Stripe
  const pi = searchParams.get('payment_intent')
  if (pi) {
    paymentIntentId.value = pi
  }

  // Handle setup_intent from Stripe
  const si = searchParams.get('setup_intent')
  if (si) {
    setupIntentId.value = si
  }

  // Handle custom result param (for checkout return)
  const result = searchParams.get('result')
  if (result === 'success') {
    status.value = 'succeeded'
    visible.value = true
    message.value = 'Payment successful!'
  } else if (result === 'cancel') {
    status.value = 'canceled'
    visible.value = true
    message.value = 'Payment was canceled.'
  }

  // Generate appropriate message
  if (status.value && !message.value) {
    switch (status.value) {
      case 'succeeded':
        message.value = 'Payment completed successfully!'
        break
      case 'processing':
        message.value = 'Payment is being processed...'
        break
      case 'failed':
        message.value = 'Payment failed. Please try again.'
        break
      case 'canceled':
        message.value = 'Payment was canceled.'
        break
    }
  }
}

function dismiss() {
  visible.value = false
  // Clean up URL params
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.delete('redirect_status')
    url.searchParams.delete('payment_intent')
    url.searchParams.delete('setup_intent')
    url.searchParams.delete('result')
    url.searchParams.delete('payment_intent_client_secret')
    url.searchParams.delete('setup_intent_client_secret')
    window.history.replaceState({}, '', url.pathname)
  }
}

onMounted(() => {
  parseQueryParams()
})

defineExpose({
  status,
  paymentIntentId,
  setupIntentId,
  dismiss,
})
</script>

<template>
  <div v-if="visible" class="payment-status" :class="status">
    <div class="status-content">
      <span class="status-icon">
        <template v-if="status === 'succeeded'">✓</template>
        <template v-else-if="status === 'processing'">⏳</template>
        <template v-else-if="status === 'failed'">✕</template>
        <template v-else-if="status === 'canceled'">⊘</template>
      </span>

      <div class="status-text">
        <strong>{{ message }}</strong>
        <p v-if="paymentIntentId" class="status-id">
          Payment Intent: <code>{{ paymentIntentId }}</code>
        </p>
        <p v-if="setupIntentId" class="status-id">
          Setup Intent: <code>{{ setupIntentId }}</code>
        </p>
      </div>

      <button class="dismiss-btn" @click="dismiss" aria-label="Dismiss">
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.payment-status {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid;
}

.payment-status.succeeded {
  background: var(--vp-c-green-soft);
  border-color: var(--vp-c-green-1);
}

.payment-status.processing {
  background: var(--vp-c-yellow-soft);
  border-color: var(--vp-c-yellow-1);
}

.payment-status.failed {
  background: var(--vp-c-danger-soft);
  border-color: var(--vp-c-danger-1);
}

.payment-status.canceled {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-divider);
}

.status-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: bold;
  flex-shrink: 0;
}

.succeeded .status-icon {
  background: var(--vp-c-green-1);
  color: white;
}

.processing .status-icon {
  background: var(--vp-c-yellow-1);
  color: white;
}

.failed .status-icon {
  background: var(--vp-c-danger-1);
  color: white;
}

.canceled .status-icon {
  background: var(--vp-c-text-3);
  color: white;
}

.status-text {
  flex: 1;
}

.status-text strong {
  display: block;
  margin-bottom: 0.25rem;
}

.succeeded .status-text strong {
  color: var(--vp-c-green-1);
}

.processing .status-text strong {
  color: var(--vp-c-yellow-darker);
}

.failed .status-text strong {
  color: var(--vp-c-danger-1);
}

.canceled .status-text strong {
  color: var(--vp-c-text-2);
}

.status-id {
  margin: 0.25rem 0 0 0;
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
}

.status-id code {
  padding: 0.125rem 0.375rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  font-size: 0.75rem;
}

.dismiss-btn {
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.dismiss-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--vp-c-text-1);
}
</style>
