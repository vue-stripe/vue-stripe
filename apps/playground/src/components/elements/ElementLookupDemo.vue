<script setup lang="ts">
// Calls useStripeElements().getElement('payment') and compares it with the element
// VueStripePaymentElement exposes (must render inside VueStripeElements).
import { computed, ref } from 'vue'
import { useStripeElements } from '@vue-stripe/vue-stripe'
import { Button } from '@/components/ui'

const props = defineProps<{ exposedElement: () => unknown }>()
const emit = defineEmits<{ lookup: [message: string] }>()

const { elements, getElement } = useStripeElements()
const offAvailable = computed(() => (elements.value && 'off' in elements.value ? 'Yes' : 'No'))
const result = ref<string | null>(null)

const lookUp = () => {
  const found = getElement('payment')
  const same = found !== null && found === props.exposedElement()
  result.value = found
    ? `Returned the Payment Element. Same object as VueStripePaymentElement's exposed element: ${same ? 'Yes' : 'No'}`
    : 'Returned null'
  emit('lookup', result.value)
}
</script>

<template>
  <div class="mt-4 p-4 bg-secondary rounded-lg text-left text-sm">
    <h4 class="mt-0 mb-3 text-base font-semibold">useStripeElements().getElement()</h4>
    <ul class="mb-3 pl-5 list-disc">
      <li class="mb-2"><strong>elements.off available: </strong>{{ offAvailable }}</li>
    </ul>
    <Button size="sm" data-test="get-element" @click="lookUp">getElement('payment')</Button>
    <p v-if="result" class="mt-3 p-3 rounded-md bg-success/10 text-success" data-test="lookup">
      {{ result }}
    </p>
  </div>
</template>
