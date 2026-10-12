<script setup lang="ts">
// Rendered inside VueStripeCheckoutFormProvider: VueStripeCheckoutForm is created with the
// Checkout Form SDK (sdk.createForm()), and useCheckoutForm() drives the session.
import { computed, ref } from 'vue'
import {
  VueStripeCheckoutForm,
  VueStripeCurrencySelectorElement,
  useCheckoutForm
} from '@vue-stripe/vue-stripe'
import type {
  StripeCheckoutFormChangeEvent,
  StripeCheckoutFormConfirmEvent,
  StripeCheckoutFormOptions
} from '@vue-stripe/vue-stripe'
import { Badge, Button, Label } from '@/components/ui'

const props = defineProps<{
  layout: NonNullable<StripeCheckoutFormOptions['layout']>
  /** Render the Currency Selector next to the form (Adaptive Pricing). */
  currencySelector: boolean
}>()

const emit = defineEmits<{
  log: [event: string, data?: string]
}>()

const { session, loading, error, confirm } = useCheckoutForm()

const formRef = ref<InstanceType<typeof VueStripeCheckoutForm> | null>(null)
const complete = ref(false)
const views = ref<NonNullable<StripeCheckoutFormChangeEvent['views']>>([])
const result = ref<string | null>(null)

const total = computed(() => session.value?.total.total.amount ?? '')
const formOptions = computed<StripeCheckoutFormOptions>(() => ({ layout: props.layout }))

const onChange = (event: StripeCheckoutFormChangeEvent) => {
  complete.value = event.complete
  views.value = event.views ?? []
  emit('log', 'change', `complete ${event.complete}, empty ${event.empty}`)
}

// The form's own Pay button (or a wallet) fires confirm; pass the event to Stripe.
const onConfirm = async (event: StripeCheckoutFormConfirmEvent) => {
  emit('log', 'confirm', event.source)
  result.value = null
  const res = await confirm({ formConfirmEvent: event, redirect: 'if_required' })
  result.value =
    res.type === 'error'
      ? `Error: ${res.error.message}`
      : `Status: ${res.session.status.type}, ${res.session.total.total.amount}`
  emit('log', 'confirm result', res.type === 'error' ? res.error.message : res.type)
}

const readValue = async () => {
  const value = await formRef.value?.getValue()
  result.value = value ? JSON.stringify(value.value, null, 2) : 'The form is not ready'
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="rounded-lg border bg-secondary p-4 text-sm" data-test="session-state">
      <div class="mb-2 flex items-center justify-between">
        <span class="font-semibold">Session</span>
        <Badge :variant="complete ? 'default' : 'secondary'" data-test="form-complete">
          form complete: {{ complete }}
        </Badge>
      </div>
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt class="text-muted-foreground">status</dt>
        <dd>{{ session?.status.type ?? (loading ? 'loading...' : '-') }}</dd>
        <dt class="text-muted-foreground">total</dt>
        <dd>{{ total || '-' }}</dd>
        <dt class="text-muted-foreground">currency</dt>
        <dd>{{ session?.currency?.toUpperCase() ?? '-' }}</dd>
      </dl>
    </div>

    <div v-if="props.currencySelector" data-test="currency-selector">
      <Label class="mb-2 block">Currency (Adaptive Pricing)</Label>
      <VueStripeCurrencySelectorElement
        @loaderror="(e) => emit('log', 'loaderror', e.error.message)"
      />
    </div>

    <div v-if="views.length > 1" class="flex flex-wrap gap-2" data-test="form-views">
      <Button
        v-for="(view, index) in views"
        :key="view.label"
        size="sm"
        :variant="view.active ? 'default' : 'outline'"
        :disabled="!view.canNavigate"
        @click="formRef?.setView(index)"
      >
        {{ view.label }}
      </Button>
    </div>

    <div data-test="checkout-form">
      <VueStripeCheckoutForm
        ref="formRef"
        :options="formOptions"
        @ready="emit('log', 'ready', 'form mounted')"
        @loaderstart="emit('log', 'loaderstart')"
        @loaderror="(e) => emit('log', 'loaderror', e.error.message)"
        @change="onChange"
        @confirm="onConfirm"
        @cancel="emit('log', 'cancel')"
      />
    </div>

    <div class="flex gap-2">
      <Button variant="outline" size="sm" data-test="get-value" @click="readValue">
        getValue()
      </Button>
    </div>

    <pre
      v-if="result"
      class="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap"
      data-test="result"
      >{{ result }}</pre>
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
  </div>
</template>
