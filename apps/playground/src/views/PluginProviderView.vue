<script setup lang="ts">
import { createApp, defineComponent, h, inject, onBeforeUnmount, ref, watch, type App } from 'vue'
import {
  createVueStripe,
  useStripe,
  VueStripeElements,
  VueStripePaymentElement
} from '@vue-stripe/vue-stripe'
import { Card, CardHeader, CardTitle, CardContent, Alert, AlertDescription } from '@/components/ui'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')

const elementReady = ref(false)

// Everything below runs inside an app that only installs createVueStripe():
// there is no VueStripeProvider anywhere in its tree.
const PluginDemo = defineComponent({
  name: 'PluginDemo',
  setup() {
    const { stripe, loading, error } = useStripe()
    return () =>
      h('div', { class: 'flex flex-col gap-4' }, [
        h('p', { class: 'text-sm', 'data-test': 'use-stripe-state' }, [
          'useStripe(): ',
          h(
            'code',
            error.value
              ? `error: ${error.value}`
              : loading.value
                ? 'loading'
                : stripe.value
                  ? 'Stripe instance ready'
                  : 'null'
          )
        ]),
        h(
          VueStripeElements,
          { mode: 'payment', amount: 2000, currency: 'usd' },
          {
            default: () =>
              h(VueStripePaymentElement, {
                onReady: () => {
                  elementReady.value = true
                }
              })
          }
        )
      ])
  }
})

const mountPoint = ref<HTMLElement | null>(null)
let pluginApp: App | null = null

const unmountPluginApp = () => {
  pluginApp?.unmount()
  pluginApp = null
  elementReady.value = false
}

// A separate app, so the plugin is installed exactly as a user would in main.ts.
watch(
  [mountPoint, () => stripeConfig?.publishableKey],
  ([el, publishableKey]) => {
    unmountPluginApp()
    if (!el || !publishableKey) return
    pluginApp = createApp(PluginDemo).use(createVueStripe({ publishableKey }))
    pluginApp.mount(el)
  },
  { flush: 'post' }
)

onBeforeUnmount(unmountPluginApp)
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>createVueStripe() as the provider</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground mb-4">
          The demo below is a separate Vue app that only calls
          <code>app.use(createVueStripe({ publishableKey }))</code>. It has no
          <code>VueStripeProvider</code>: <code>useStripe()</code>,
          <code>VueStripeElements</code> and the Payment Element get Stripe from the plugin, which
          loads Stripe.js once, the first time something needs it.
        </p>
        <pre
          class="bg-secondary rounded-lg p-4 text-xs overflow-x-auto"
        ><code>app.use(createVueStripe({ publishableKey: 'pk_test_...' }))

&lt;VueStripeElements mode="payment" :amount="2000" currency="usd"&gt;
  &lt;VueStripePaymentElement /&gt;
&lt;/VueStripeElements&gt;</code></pre>
      </CardContent>
    </Card>

    <Alert v-if="!stripeConfig?.publishableKey" variant="warning">
      <AlertDescription>
        No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
      </AlertDescription>
    </Alert>

    <Card v-else>
      <CardHeader>
        <CardTitle class="text-lg">Live demo (no VueStripeProvider)</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref="mountPoint" class="bg-card rounded-lg p-4 border" data-test="plugin-app" />
        <p class="text-xs text-muted-foreground mt-2" data-test="element-ready">
          Payment Element ready: {{ elementReady ? 'Yes' : 'No' }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>
