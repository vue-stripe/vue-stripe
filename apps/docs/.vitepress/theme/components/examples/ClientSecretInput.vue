<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  generatedSecret?: string | null
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  update: [value: string]
}>()

const clientSecret = ref(props.modelValue || '')

// Validate client secret format
const isValid = computed(() => {
  if (!clientSecret.value) return false
  // Payment Intent: pi_xxx_secret_xxx
  // Setup Intent: seti_xxx_secret_xxx
  return /^(pi|seti)_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/.test(clientSecret.value)
})

const hasInput = computed(() => clientSecret.value.length > 0)

// Auto-fill when generatedSecret is available
watch(
  () => props.generatedSecret,
  (value) => {
    if (value) {
      clientSecret.value = value
      emit('update:modelValue', value)
      emit('update', value)
    }
  },
  { immediate: true }
)

watch(clientSecret, (value) => {
  emit('update:modelValue', value)
  if (isValid.value) {
    emit('update', value)
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      clientSecret.value = value
    }
  }
)

defineExpose({
  clientSecret,
  isValid,
})
</script>

<template>
  <div class="client-secret-input">
    <div class="step-header">
      <span class="step-number">2</span>
      <h4>Client Secret</h4>
      <span class="badge frontend">Frontend</span>
    </div>

    <p class="description">
      The client secret from Step 1 is automatically provided below.
      This is what your backend returns to authorize the payment.
    </p>

    <div class="input-wrapper">
      <div class="readonly-display" :class="{ valid: isValid, empty: !hasInput }">
        <span v-if="hasInput" class="secret-value">{{ clientSecret }}</span>
        <span v-else class="placeholder">Waiting for Step 1...</span>
        <span v-if="isValid" class="readonly-badge">Auto-filled</span>
      </div>
    </div>

    <div v-if="isValid" class="valid-msg">
      <span class="icon">✓</span>
      Valid client secret - ready for payment
    </div>

    <div v-else-if="!hasInput" class="waiting-msg">
      <span class="icon">⏳</span>
      Select a product and generate a payment intent in Step 1
    </div>
  </div>
</template>

<style scoped>
.client-secret-input {
  margin-bottom: 1.5rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
}

.step-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.badge {
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
}

.badge.frontend {
  background: var(--vp-c-indigo-soft);
  color: var(--vp-c-indigo-1);
}

.description {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.readonly-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-divider);
  border-radius: 6px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  min-height: 48px;
}

.readonly-display.valid {
  border-color: var(--vp-c-green-1);
  background: var(--vp-c-green-soft);
}

.readonly-display.empty {
  border-style: dashed;
}

.secret-value {
  flex: 1;
  word-break: break-all;
  color: var(--vp-c-text-1);
}

.placeholder {
  color: var(--vp-c-text-3);
  font-style: italic;
}

.readonly-badge {
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-green-1);
  color: white;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  font-family: var(--vp-font-family-base);
}

.valid-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-green-soft);
  border-radius: 4px;
  color: var(--vp-c-green-1);
  font-size: 0.875rem;
}

.waiting-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.icon {
  font-size: 1rem;
}
</style>
