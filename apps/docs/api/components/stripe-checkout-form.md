# VueStripeCheckoutForm

Renders Stripe's complete **Checkout Form**: contact details, addresses, shipping options, tax ID, express checkout wallets, the payment method, the order total and the Pay button, in one element. Use it inside a [VueStripeCheckoutFormProvider](/api/components/stripe-checkout-form-provider), which creates it with `checkoutFormSdk.createForm()`. To lay out the fields yourself, use [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) with individual elements; [Choosing an integration](/guide/approaches#choosing-among-the-checkout-options) compares the options. [Add the Checkout Form](/guide/checkout-form) walks through a full integration.

::: warning Beta: requires Stripe access
The Checkout Form is a Stripe beta. Your Stripe account needs access to the Checkout Form SDK; the `compact` layout is a separate private preview. Without access, Stripe's message appears in the `#error` slot and `@loaderror` fires.
:::

::: tip Live demo
The [Checkout Form demo](/live-demo/checkout-form) pays a Checkout Session with this component and `useCheckoutForm()`.
:::

## Usage

```vue
<template>
  <VueStripeProvider :publishable-key="publishableKey">
    <VueStripeCheckoutFormProvider :client-secret="clientSecret">
      <PayForm />
    </VueStripeCheckoutFormProvider>
  </VueStripeProvider>
</template>
```

```vue
<!-- PayForm.vue -->
<template>
  <VueStripeCheckoutForm
    :options="{ layout: 'expanded' }"
    @change="onChange"
    @confirm="onConfirm"
  />
  <p v-if="message">{{ message }}</p>
</template>

<script setup>
import { ref } from 'vue'
import { VueStripeCheckoutForm, useCheckoutForm } from '@vue-stripe/vue-stripe'

const { confirm } = useCheckoutForm()
const message = ref('')

const onChange = (event) => console.log('complete:', event.complete)

// Fired by the form's Pay button or a wallet: pass the event on to Stripe.
const onConfirm = async (event) => {
  const result = await confirm({ formConfirmEvent: event })
  if (result.type === 'error') message.value = result.error.message
}
</script>
```

The form has its own Pay button. Confirm from `@confirm` with `useCheckoutForm().confirm({ formConfirmEvent: event })`; until you call `confirm`, nothing is charged.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `StripeCheckoutFormOptions` | No | Passed to `createForm()` |

### Options Object

| Option | Type | Description |
|--------|------|-------------|
| `layout` | `'expanded' \| 'compact'` | `expanded` shows every section at once; `compact` splits the form into views (private preview) |
| `contacts` | `ContactOption[]` | Saved addresses to offer |
| `expressCheckout` | `{ buttonHeight?, buttonTheme?, paymentMethods? }` | Express checkout wallet buttons: height (40 to 55 px), theme per wallet, which wallets to show |
| `features` | `{ promotionCodeCollection?: 'auto' \| 'never' }` | Hide the promotion code field (it shows only when the session allows promotion codes) |

The Checkout Form has no `update()`: options are read when the form is created. Re-mount it (for example with a `:key`) to change them.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeCheckoutForm` | Emitted when the form is fully rendered |
| `@change` | `StripeCheckoutFormChangeEvent` | Emitted when a value changes: `complete`, `empty`, `value`, `status` per section and, in the compact layout, `views` |
| `@confirm` | `StripeCheckoutFormConfirmEvent` | The customer clicked Pay (`source: 'checkout-form-pay-button'`) or authorized a wallet (`source: 'checkout-form-ece'`). Pass it to `confirm({ formConfirmEvent })` |
| `@cancel` | `{ elementType: 'checkoutForm' }` | The customer closed the payment interface (for example a wallet sheet) |
| `@focus` | - | Emitted when the form gains focus |
| `@blur` | - | Emitted when the form loses focus |
| `@escape` | - | Emitted when the user presses the Escape key |
| `@loaderstart` | `{ elementType: 'checkoutForm' }` | Emitted when Stripe's loader is mounted |
| `@loaderror` | `{ elementType: 'checkoutForm'; error: StripeError }` | Emitted when the form fails to load |

`@loaderror` also fires when creating the form fails (for example a layout your account cannot use), with the payload `{ elementType: 'checkoutForm', error: { message } }`; the message is also shown through the `#error` slot.

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the form is loading (default: "Loading checkout form...") |
| `#error` | `{ error: string }` | Rendered when the form has an error: a load error or a creation error |

```vue
<VueStripeCheckoutForm>
  <template #loading>
    <div class="skeleton-loader">Loading...</div>
  </template>

  <template #error="{ error }">
    <p class="my-error">{{ error }}</p>
  </template>
</VueStripeCheckoutForm>
```

## Exposed Methods & Properties

Access these via a template ref:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeCheckoutForm \| null>` | The Stripe form instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the form emits `ready` |
| `error` | `Ref<string \| null>` | Current error message (load or creation error) |
| `focus()` | `() => void` | Focus the form |
| `blur()` | `() => void` | Blur the form |
| `clear()` | `() => void` | Clear the form's values |
| `getValue()` | `() => Promise<StripeCheckoutFormValue \| undefined>` | The current values and per-section status (`undefined` before the form exists) |
| `setView(viewIndex)` | `(viewIndex: number) => Promise<void>` | Compact layout: go to the view at this index of the `@change` event's `views` |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeCheckoutForm } from '@vue-stripe/vue-stripe'
import type { StripeCheckoutFormChangeEvent } from '@vue-stripe/vue-stripe'

const formRef = ref<InstanceType<typeof VueStripeCheckoutForm> | null>(null)
const views = ref<NonNullable<StripeCheckoutFormChangeEvent['views']>>([])

const onChange = (event: StripeCheckoutFormChangeEvent) => {
  views.value = event.views ?? []
}

const logValue = async () => {
  const value = await formRef.value?.getValue()
  console.log(value?.value.customerDetails.email)
}
</script>

<template>
  <button
    v-for="(view, index) in views"
    :key="view.label"
    :disabled="!view.canNavigate"
    @click="formRef?.setView(index)"
  >
    {{ view.label }}
  </button>
  <VueStripeCheckoutForm ref="formRef" :options="{ layout: 'compact' }" @change="onChange" />
</template>
```

## Styling

The component renders this markup around Stripe's iframe:

```html
<div class="vue-stripe-checkout-form vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-checkout-form-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus vue-stripe-checkout-form-loading / vue-stripe-element-loading while loading -->
  <div class="vue-stripe-checkout-form-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-checkout-form-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles for these classes ship in the package stylesheet. Import it once in your app:

```ts
import '@vue-stripe/vue-stripe/style.css'
```

Style the form's inside with the provider's `appearance` prop (or `useCheckoutForm().changeAppearance()`).

## TypeScript

```ts
import type {
  StripeCheckoutForm,
  StripeCheckoutFormChangeEvent,
  StripeCheckoutFormConfirmEvent,
  StripeCheckoutFormOptions,
  StripeCheckoutFormValue
} from '@vue-stripe/vue-stripe'

const options: StripeCheckoutFormOptions = {
  layout: 'expanded',
  features: { promotionCodeCollection: 'never' }
}

const onConfirm = (event: StripeCheckoutFormConfirmEvent) => {
  console.log(event.source)
}
```

## See Also

- [VueStripeCheckoutFormProvider](/api/components/stripe-checkout-form-provider) - required parent
- [useCheckoutForm](/api/composables/use-checkout-form) - confirm the form and read the session
- [Checkout Form guide](/guide/checkout-form) - end-to-end walkthrough
