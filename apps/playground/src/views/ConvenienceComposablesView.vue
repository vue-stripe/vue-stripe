<script setup lang="ts">
import { ref, inject, defineComponent, h } from 'vue'
import {
  VueStripeProvider,
  VueStripeElements,
  VueStripeCardElement,
  VueStripePaymentElement,
  useCreatePaymentMethod,
  usePaymentIntent
} from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label
} from '@/components/ui'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')

// --- Create Payment Method demo (uses a Card Element) ---
const CreatePaymentMethodDemo = defineComponent({
  name: 'CreatePaymentMethodDemo',
  setup() {
    const { createPaymentMethod, loading, error } = useCreatePaymentMethod()
    const cardRef = ref<any>()
    const result = ref<string | null>(null)

    const onCreate = async () => {
      result.value = null
      const card = cardRef.value?.element
      const res = await createPaymentMethod(card ? { type: 'card', card } : {})
      result.value = res?.paymentMethod
        ? `✅ ${res.paymentMethod.id}`
        : `❌ ${res?.error?.message || 'failed'}`
    }

    return () =>
      h('div', { class: 'flex flex-col gap-4' }, [
        h('div', { class: 'bg-card rounded-lg p-4 border' }, [
          h(VueStripeCardElement, { ref: cardRef })
        ]),
        h(Button, { onClick: onCreate, disabled: loading.value, 'data-test': 'create-pm' },
          () => (loading.value ? 'Creating…' : 'Create Payment Method')),
        result.value
          ? h('code', { class: 'block text-sm p-3 rounded bg-secondary', 'data-test': 'pm-result' }, result.value)
          : null,
        error.value ? h(Alert, { variant: 'destructive' }, () => h(AlertDescription, () => error.value)) : null
      ])
  }
})

// --- Create Payment Method via the Payment Element (deferred, zero-arg) ---
// Exercises the auto-inject path: createPaymentMethod() with no args, which
// calls elements.submit() before stripe.createPaymentMethod({ elements }).
const CreatePaymentMethodElementDemo = defineComponent({
  name: 'CreatePaymentMethodElementDemo',
  setup() {
    const { createPaymentMethod, loading } = useCreatePaymentMethod()
    const result = ref<string | null>(null)

    const onCreate = async () => {
      result.value = null
      const res = await createPaymentMethod() // zero-arg → Payment Element flow
      result.value = res?.paymentMethod
        ? `✅ ${res.paymentMethod.id}`
        : `❌ ${res?.error?.message || 'failed'}`
    }

    return () =>
      h('div', { class: 'flex flex-col gap-4' }, [
        h('div', { class: 'bg-card rounded-lg p-4 border' }, [
          h(VueStripePaymentElement)
        ]),
        h(Button, { onClick: onCreate, disabled: loading.value, 'data-test': 'create-pm-element' },
          () => (loading.value ? 'Creating…' : 'Create Payment Method')),
        result.value
          ? h('code', { class: 'block text-sm p-3 rounded bg-secondary', 'data-test': 'pm-element-result' }, result.value)
          : null
      ])
  }
})

// --- Retrieve Payment Intent demo ---
const RetrievePaymentIntentDemo = defineComponent({
  name: 'RetrievePaymentIntentDemo',
  setup() {
    const { retrievePaymentIntent } = usePaymentIntent()
    const secret = ref('')
    const status = ref<string | null>(null)

    const onRetrieve = async () => {
      status.value = null
      const res = await retrievePaymentIntent(secret.value.trim())
      status.value = res?.paymentIntent
        ? `✅ ${res.paymentIntent.id} — ${res.paymentIntent.status}`
        : `❌ ${res?.error?.message || 'failed'}`
    }

    return () =>
      h('div', { class: 'flex flex-col gap-3' }, [
        h(Input, {
          modelValue: secret.value,
          'onUpdate:modelValue': (v: string) => (secret.value = v),
          placeholder: 'pi_xxx_secret_xxx',
          'data-test': 'pi-secret'
        }),
        h(Button, { onClick: onRetrieve, disabled: !secret.value.trim(), 'data-test': 'retrieve-pi' },
          () => 'Retrieve PaymentIntent'),
        status.value
          ? h('code', { class: 'block text-sm p-3 rounded bg-secondary', 'data-test': 'pi-result' }, status.value)
          : null
      ])
  }
})
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Convenience Composables</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">
          <code>useCreatePaymentMethod()</code>, <code>useHandleNextAction()</code>, and the
          <code>retrievePaymentIntent()</code> / <code>retrieveSetupIntent()</code> helpers wrap the raw
          Stripe instance for common one-off operations. The interactive demos below cover
          <code>createPaymentMethod()</code> and <code>retrievePaymentIntent()</code>;
          <code>useHandleNextAction()</code> requires a PaymentIntent in <code>requires_action</code>
          (e.g. 3D&nbsp;Secure) and is documented in the API reference.
        </p>
      </CardContent>
    </Card>

    <Alert v-if="!stripeConfig?.publishableKey" variant="warning">
      <AlertDescription>
        No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
      </AlertDescription>
    </Alert>

    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">useCreatePaymentMethod()</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground mb-4 text-sm">
            Enter a test card (e.g. <code>4242 4242 4242 4242</code>) and create a PaymentMethod.
          </p>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements>
              <CreatePaymentMethodDemo />
            </VueStripeElements>
          </VueStripeProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">useCreatePaymentMethod() — Payment Element</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground mb-4 text-sm">
            Deferred Payment Element flow. <code>createPaymentMethod()</code> is called with no
            arguments, so it auto-injects the Elements instance and runs
            <code>elements.submit()</code> first.
          </p>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <VueStripeElements mode="payment" currency="usd" :amount="1099">
              <CreatePaymentMethodElementDemo />
            </VueStripeElements>
          </VueStripeProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">retrievePaymentIntent()</CardTitle>
        </CardHeader>
        <CardContent>
          <Label class="mb-2 block text-sm">PaymentIntent client secret</Label>
          <VueStripeProvider :publishable-key="stripeConfig.publishableKey">
            <RetrievePaymentIntentDemo />
          </VueStripeProvider>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
