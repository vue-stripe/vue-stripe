---
title: "useCheckoutForm: Checkout Form state (beta)"
description: "useCheckoutForm reference (beta): read the Checkout Session state and call confirm, promotion code and line item actions from a Vue Checkout Form."
---

# useCheckoutForm

Drives a **Checkout Form** integration from inside a [`VueStripeCheckoutFormProvider`](/api/components/stripe-checkout-form-provider). Returns the reactive session state, the Form SDK's actions (`confirm`, `applyPromotionCode`, `updateLineItemQuantity`, ...) and the SDK's `changeAppearance` / `loadFonts` / `getForm`.

::: warning Beta: requires Stripe access
The Checkout Form SDK (`stripe.initCheckoutFormSdk()`, `ui_mode: 'form'`) is a Stripe beta. Your Stripe account needs access.
:::

::: tip Usage context
Must be called within a `VueStripeCheckoutFormProvider`, which itself must be inside a `VueStripeProvider`. Calling it elsewhere, including inside a `VueStripeCheckoutElementsProvider`, throws `VueStripeCheckoutError`.
:::

::: tip Live demo
The [Checkout Form demo](/live-demo/checkout-form) confirms the form with `confirm({ formConfirmEvent })`.
:::

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { VueStripeCheckoutForm, useCheckoutForm } from '@vue-stripe/vue-stripe'

const { session, confirm, loading, error } = useCheckoutForm()
const message = ref('')

// The form's Pay button fires @confirm; hand its event to Stripe.
const onConfirm = async (event) => {
  const result = await confirm({ formConfirmEvent: event })
  if (result.type === 'error') message.value = result.error.message
}
</script>

<template>
  <VueStripeCheckoutForm @confirm="onConfirm" />
  <p v-if="!loading && session">Total: {{ session.total.total.amount }}</p>
  <p v-if="message || error">{{ message || error }}</p>
</template>
```

## Return Value

```ts
interface UseCheckoutFormReturn {
  checkout: Readonly<Ref<StripeCheckoutFormSdk | null>>
  actions: Readonly<Ref<StripeCheckoutFormLoadActionsSuccess | null>>
  session: Readonly<Ref<StripeCheckoutSession | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  getSession: () => StripeCheckoutSession | null
  // Form SDK actions: signatures come straight from @stripe/stripe-js
  confirm: StripeCheckoutFormLoadActionsSuccess['confirm']
  applyPromotionCode: StripeCheckoutFormLoadActionsSuccess['applyPromotionCode']
  removePromotionCode: StripeCheckoutFormLoadActionsSuccess['removePromotionCode']
  updateLineItemQuantity: StripeCheckoutFormLoadActionsSuccess['updateLineItemQuantity']
  updateShippingOption: StripeCheckoutFormLoadActionsSuccess['updateShippingOption']
  runServerUpdate: StripeCheckoutFormLoadActionsSuccess['runServerUpdate']
  validateElements: StripeCheckoutFormLoadActionsSuccess['validateElements']
  addOptionalLineItem: StripeCheckoutFormLoadActionsSuccess['addOptionalLineItem']
  removeOptionalLineItem: StripeCheckoutFormLoadActionsSuccess['removeOptionalLineItem']
  // On the SDK handle
  changeAppearance: StripeCheckoutFormSdk['changeAppearance']
  loadFonts: StripeCheckoutFormSdk['loadFonts']
  getForm: StripeCheckoutFormSdk['getForm']
  getCurrencySelectorElement: StripeCheckoutFormSdk['getCurrencySelectorElement']
}
```

### State

| Member | Type | Description |
|--------|------|-------------|
| `checkout` | `Readonly<Ref<StripeCheckoutFormSdk \| null>>` | The Checkout Form SDK (exists as soon as the provider initialized it) |
| `actions` | `Readonly<Ref<StripeCheckoutFormLoadActionsSuccess \| null>>` | The raw Form SDK actions (`null` until `loadActions()` resolves) |
| `session` | `Readonly<Ref<StripeCheckoutSession \| null>>` | Reactive session snapshot, kept in sync with Stripe's `change` event |
| `loading` | `Readonly<Ref<boolean>>` | `true` until the actions have loaded |
| `error` | `Readonly<Ref<string \| null>>` | Initialization error, shared with the provider |
| `getSession()` | `() => StripeCheckoutSession \| null` | Imperative snapshot of the current session (prefer the reactive `session`) |

### Actions

Each action is forwarded to `actions` (Stripe's `StripeCheckoutFormLoadActionsSuccess`):

| Member | Description |
|--------|-------------|
| `confirm(options?)` | Confirm the checkout. Pass the form's `@confirm` event as `formConfirmEvent`. Resolves `{ type: 'success', session }` or `{ type: 'error', error }` |
| `applyPromotionCode(code)` / `removePromotionCode()` | Manage promotion codes |
| `updateLineItemQuantity({ lineItem, quantity })` | Change a line item's quantity |
| `updateShippingOption(id)` | Select a shipping rate |
| `runServerUpdate(fn)` | Run your own server update and refresh the session afterwards |
| `validateElements()` | Validate the form |
| `addOptionalLineItem(priceId)` / `removeOptionalLineItem(priceId)` | Toggle optional items configured on the session. Stripe rejects `optional_items` on `form` sessions, so on those they resolve `{ type: 'error' }` with `"<action> is not available for this Checkout Session"` |

The form collects the email, phone number, addresses and tax ID itself, so the Form SDK has no `updateEmail`, `updatePhoneNumber`, `updateBillingAddress`, `updateShippingAddress` or `updateTaxIdInfo`. Use [`useCheckoutSession`](/api/composables/use-checkout-session) with `VueStripeCheckoutElementsProvider` if you need to set those from code.

### SDK methods

| Member | Description |
|--------|-------------|
| `changeAppearance(appearance)` | Restyle the form at runtime (`Appearance` without `rules`) |
| `loadFonts(fonts)` | Load additional fonts into the form |
| `getForm()` | The form created by `VueStripeCheckoutForm`, or `null` |
| `getCurrencySelectorElement()` | The Currency Selector created on this SDK, or `null` |

These call the SDK handle, which exists before the actions load. Called before the SDK exists, `changeAppearance` and `loadFonts` log a `[Vue Stripe]` warning and do nothing, and the getters return `null`.

::: warning Before the actions load
Until `loadActions()` resolves (`loading.value === true`), every action resolves to:

```ts
{ type: 'error', error: { message: 'Checkout session is not ready yet', code: null } }
```

It does not throw, so the same `result.type` check covers it.
:::

## Confirming

`confirm()` takes the same options as in [`useCheckoutSession`](/api/composables/use-checkout-session#confirming), plus the form's confirm event:

```ts
const { confirm } = useCheckoutForm()

const onConfirm = async (event: StripeCheckoutFormConfirmEvent) => {
  // Session created with return_url: no returnUrl here. 'if_required' keeps card payments on the page.
  const result = await confirm({ formConfirmEvent: event, redirect: 'if_required' })
  if (result.type === 'error') console.error(result.error.message)
  else console.log(result.session.status.type) // 'complete'
}
```

When the Checkout Session was created with `return_url`, do not pass `returnUrl`: Stripe rejects a confirm that sets both.

## TypeScript

```ts
import { useCheckoutForm } from '@vue-stripe/vue-stripe'
import type {
  StripeCheckoutConfirmResult,
  StripeCheckoutFormConfirmEvent,
  UseCheckoutFormReturn
} from '@vue-stripe/vue-stripe'

const form: UseCheckoutFormReturn = useCheckoutForm()

const pay = (event: StripeCheckoutFormConfirmEvent): Promise<StripeCheckoutConfirmResult> =>
  form.confirm({ formConfirmEvent: event })
```

## See Also

- [VueStripeCheckoutFormProvider](/api/components/stripe-checkout-form-provider) - required parent
- [VueStripeCheckoutForm](/api/components/stripe-checkout-form) - the form
- [Checkout Form guide](/guide/checkout-form) - end-to-end walkthrough
