# useCheckoutSession

Drives an **Elements with Checkout Sessions** integration from inside a [`VueStripeCheckoutElementsProvider`](/api/components/stripe-checkout-provider). Returns the reactive session state, every session action (`confirm`, `applyPromotionCode`, `updateEmail`, …) and the SDK's `changeAppearance` / `loadFonts`.

::: tip Usage context
Must be called within a `VueStripeCheckoutElementsProvider` (or its deprecated alias `VueStripeCheckoutProvider`), which itself must be inside a `VueStripeProvider`. Calling it elsewhere throws `VueStripeCheckoutError`.
:::

## Usage

```vue
<script setup>
import { useCheckoutSession } from '@vue-stripe/vue-stripe'

const {
  session,            // reactive snapshot
  confirm,
  updateEmail,
  applyPromotionCode,
  loading,
  error
} = useCheckoutSession()

const onPay = async () => {
  // The session was created with return_url on the server, so no returnUrl here.
  const result = await confirm()
  if (result.type === 'error') {
    console.error(result.error.message)
  }
}
</script>

<template>
  <p v-if="session">Total: {{ session.total.total.amount }}</p>
  <input :value="session?.email" @change="e => updateEmail(e.target.value)" />
  <button :disabled="loading || !session?.canConfirm" @click="onPay">Pay</button>
  <p v-if="error">{{ error }}</p>
</template>
```

## Return Value

```ts
interface UseCheckoutSessionReturn {
  checkout: Readonly<Ref<StripeCheckoutElementsSdk | null>>
  actions: Readonly<Ref<StripeCheckoutLoadActionsSuccess | null>>
  session: Readonly<Ref<StripeCheckoutSession | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  getSession: () => StripeCheckoutSession | null
  // Session actions — signatures come straight from @stripe/stripe-js
  confirm: StripeCheckoutLoadActionsSuccess['confirm']
  applyPromotionCode: StripeCheckoutLoadActionsSuccess['applyPromotionCode']
  removePromotionCode: StripeCheckoutLoadActionsSuccess['removePromotionCode']
  updateEmail: StripeCheckoutLoadActionsSuccess['updateEmail']
  updatePhoneNumber: StripeCheckoutLoadActionsSuccess['updatePhoneNumber']
  updateBillingAddress: StripeCheckoutLoadActionsSuccess['updateBillingAddress']
  updateShippingAddress: StripeCheckoutLoadActionsSuccess['updateShippingAddress']
  updateLineItemQuantity: StripeCheckoutLoadActionsSuccess['updateLineItemQuantity']
  updateShippingOption: StripeCheckoutLoadActionsSuccess['updateShippingOption']
  updateTaxIdInfo: StripeCheckoutLoadActionsSuccess['updateTaxIdInfo']
  runServerUpdate: StripeCheckoutLoadActionsSuccess['runServerUpdate']
  validateElements: StripeCheckoutLoadActionsSuccess['validateElements']
  addOptionalLineItem: StripeCheckoutLoadActionsSuccess['addOptionalLineItem']
  removeOptionalLineItem: StripeCheckoutLoadActionsSuccess['removeOptionalLineItem']
  // On the SDK handle
  changeAppearance: StripeCheckoutElementsSdk['changeAppearance']
  loadFonts: StripeCheckoutElementsSdk['loadFonts']
}
```

### State

| Member | Type | Description |
|--------|------|-------------|
| `checkout` | `Readonly<Ref<StripeCheckoutElementsSdk \| null>>` | The Checkout Elements SDK (exists as soon as the provider initialized it) |
| `actions` | `Readonly<Ref<StripeCheckoutLoadActionsSuccess \| null>>` | The raw session actions (`null` until `loadActions()` resolves) |
| `session` | `Readonly<Ref<StripeCheckoutSession \| null>>` | Reactive session snapshot, kept in sync with Stripe's `change` event |
| `loading` | `Readonly<Ref<boolean>>` | `true` until the session actions have loaded |
| `error` | `Readonly<Ref<string \| null>>` | Initialization error, shared with the provider |
| `getSession()` | `() => StripeCheckoutSession \| null` | Imperative snapshot of the current session (prefer the reactive `session`) |

### Session actions

Each action is forwarded to `actions` (Stripe's `StripeCheckoutLoadActionsSuccess`):

| Member | Description |
|--------|-------------|
| `confirm(options?)` | Confirm the checkout. Resolves `{ type: 'success', session }` or `{ type: 'error', error }` |
| `applyPromotionCode(code)` / `removePromotionCode()` | Manage promotion codes |
| `updateEmail(email)` / `updatePhoneNumber(phone)` | Update contact info (pass `null` to clear) |
| `updateBillingAddress(addr)` / `updateShippingAddress(addr)` | Update addresses (pass `null` to clear) |
| `updateLineItemQuantity({ lineItem, quantity })` | Change a line item's quantity |
| `updateShippingOption(id)` | Select a shipping rate |
| `updateTaxIdInfo(info)` | Set the business name and tax ID (pass `null` to clear) |
| `runServerUpdate(fn)` | Run your own server update (e.g. changing the session server-side) and refresh the session afterwards |
| `validateElements()` | Validate every mounted Checkout element |
| `addOptionalLineItem(priceId)` / `removeOptionalLineItem(priceId)` | Toggle optional items configured on the session |

### SDK methods

| Member | Description |
|--------|-------------|
| `changeAppearance(appearance)` | Restyle every Checkout element at runtime |
| `loadFonts(fonts)` | Load additional fonts into the Checkout elements |

These two call the SDK handle, which exists before the actions load. Called before the SDK exists, they log a `[Vue Stripe]` warning and do nothing.

::: info Result shape
The actions resolve to Stripe's discriminated result: `{ type: 'success'; session }` on success or `{ type: 'error'; error }` on failure — always branch on `result.type`.
:::

::: warning Before the actions load
Until `loadActions()` resolves (`loading.value === true`), every action resolves to:

```ts
{ type: 'error', error: { message: 'Checkout session is not ready yet', code: null } }
```

It does not throw, so the same `result.type` check covers it. Disable your buttons while `loading` is `true`.
:::

## Confirming

When the Checkout Session was created on the server with `return_url`, call `confirm()` **without** `returnUrl`: Stripe rejects a confirm that sets both. Pass `returnUrl` only when the session has none.

```ts
const { confirm } = useCheckoutSession()

const result = await confirm()
if (result.type === 'error') {
  console.error(result.error.message)
}
```

From the Express Checkout Element, pass Stripe's confirm event:

```vue
<script setup>
import { VueStripeExpressCheckoutElement, useCheckoutSession } from '@vue-stripe/vue-stripe'

const { confirm } = useCheckoutSession()

const onConfirm = async (event) => {
  const result = await confirm({ expressCheckoutConfirmEvent: event })
  if (result.type === 'error') console.error(result.error.message)
}
</script>

<template>
  <VueStripeExpressCheckoutElement @confirm="onConfirm" />
</template>
```

## Building the form

`useCheckoutSession` manages session **state and actions**. The input fields are element components placed inside the provider (`VueStripePaymentElement`, `VueStripeAddressElement`, `VueStripeExpressCheckoutElement`, `VueStripeTaxIdElement`, `VueStripeCurrencySelectorElement`); they are created with the Checkout SDK automatically. See [Elements inside the provider](/api/components/stripe-checkout-provider#elements-inside-the-provider) for the accepted options.

## TypeScript

```ts
import { useCheckoutSession } from '@vue-stripe/vue-stripe'
import type { StripeCheckoutConfirmResult, UseCheckoutSessionReturn } from '@vue-stripe/vue-stripe'

const checkout: UseCheckoutSessionReturn = useCheckoutSession()

const pay = async (): Promise<StripeCheckoutConfirmResult> => checkout.confirm()
```

## See Also

- [VueStripeCheckoutElementsProvider](/api/components/stripe-checkout-provider) — required parent
- [useStripeCheckout](/api/composables/use-stripe-checkout) — redirect to hosted Checkout instead
