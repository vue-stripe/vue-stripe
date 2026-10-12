<script setup lang="ts">
// useRadarSession: stripe.createRadarSession().
import { ref } from 'vue'
import { useRadarSession } from '@vue-stripe/vue-stripe'
import { Button } from '@/components/ui'

const { createRadarSession, loading, error } = useRadarSession()
const result = ref<string | null>(null)

const onCreate = async () => {
  result.value = null
  const { radarSession } = await createRadarSession()
  if (radarSession) result.value = `Created ${radarSession['id']}`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Button :disabled="loading" data-test="create-radar" @click="onCreate">
      {{ loading ? 'Creating...' : 'Create Radar Session' }}
    </Button>
    <code v-if="result" class="block text-sm p-3 rounded bg-secondary" data-test="radar-result">{{
      result
    }}</code>
    <code v-if="error" class="block text-sm p-3 rounded bg-secondary" data-test="radar-error"
      >Error: {{ error }}</code
    >
  </div>
</template>
