<script setup lang="ts">
// Rendered inside VueStripeProvider so useRadarSession can inject the Stripe instance.
import { ref } from 'vue'
import { useRadarSession } from '@vue-stripe/vue-stripe'

const { createRadarSession, loading, error } = useRadarSession()
const sessionId = ref<string | null>(null)

async function create() {
  sessionId.value = null
  const { radarSession } = await createRadarSession()
  // Stripe.js types RadarSession as an open record, so read the ID by key.
  if (radarSession) sessionId.value = String(radarSession['id'])
}
</script>

<template>
  <div class="token-panel">
    <button
      :class="['action-btn', { disabled: loading }]"
      :disabled="loading"
      data-test="create-radar-session"
      @click="create"
    >
      {{ loading ? 'Creating...' : 'Create Radar Session' }}
    </button>
    <dl v-if="sessionId" class="result" data-test="radar-session-result">
      <dt>Radar Session</dt>
      <dd>
        <code>{{ sessionId }}</code>
      </dd>
    </dl>
    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>

<style scoped src="./token-panel.css"></style>
