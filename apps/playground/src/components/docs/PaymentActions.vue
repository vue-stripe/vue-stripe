<script setup lang="ts">
// Renderless helper (docs mirror pages, Express Checkout). Rendered inside VueStripeElements,
// it hands the library's confirm and element lookup to the parent's slot, so each example
// keeps its markup (and the page's scoped styles) in one template.
import { usePaymentIntent, useStripeElements, type StripeElements } from '@vue-stripe/vue-stripe'

const props = defineProps<{ clientSecret?: string }>()

defineSlots<{
  default(props: {
    confirm: typeof confirm
    getElement: StripeElements['getElement']
    loading: boolean
    error: string | null
  }): unknown
}>()

// confirmPayment runs elements.submit() on the injected Elements before stripe.confirmPayment().
const { confirmPayment, loading, error } = usePaymentIntent()
const { getElement } = useStripeElements()

const confirm = (returnUrl: string, redirect: 'if_required' | 'always' = 'if_required') =>
  confirmPayment({
    clientSecret: props.clientSecret ?? '',
    confirmParams: { return_url: returnUrl },
    redirect
  })
</script>

<template>
  <slot v-bind="{ confirm, getElement, loading, error }" />
</template>
