# Issuing Elements

Six components that wrap Stripe's [Issuing Elements](https://docs.stripe.com/issuing/elements). They show the sensitive details of a card you issued with Stripe Issuing (number, CVC, expiry date, PIN) inside Stripe-hosted iframes, copy them to the clipboard, or add the card to a wallet. The card data never touches your page or your server.

::: tip Walkthrough
The [Issuing Elements guide](/guide/issuing) explains the ephemeral key nonce flow end to end, with a server endpoint.
:::

::: info No live demo
Issuing Elements need an account onboarded to Stripe Issuing and an issued card. The docs' live demos run on an account without Issuing, so these elements have no live demo; the [Issuing guide](/guide/issuing) walks through the full flow.
:::

| Component | Stripe.js element type | Events |
|-----------|------------------------|--------|
| `VueStripeIssuingCardNumberDisplayElement` | `issuingCardNumberDisplay` | `@ready` |
| `VueStripeIssuingCardCvcDisplayElement` | `issuingCardCvcDisplay` | none |
| `VueStripeIssuingCardExpiryDisplayElement` | `issuingCardExpiryDisplay` | none |
| `VueStripeIssuingCardPinDisplayElement` | `issuingCardPinDisplay` | none |
| `VueStripeIssuingCardCopyButtonElement` | `issuingCardCopyButton` | `@click` |
| `VueStripeIssuingAddToWalletButtonElement` | `issuingAddToWalletButton` | `@click`, `@success` |

- The **number** and **CVC** displays return data for virtual cards only in live mode (any card in a sandbox).
- The **PIN** display needs two-factor authentication in front of the page (a Stripe requirement).
- The **copy button** is a transparent iframe that covers its parent element and copies one card detail.
- The **Add to Wallet** button is a Stripe private preview and needs beta flags (see [Add to Wallet](#add-to-wallet)).

The events are exactly the ones Stripe.js 10 declares for each element type. The CVC, expiry and PIN displays declare none, so the components show them as soon as they are mounted instead of waiting for `ready`.

## Requirements

- A Stripe account with **Issuing** enabled and an issued card (`ic_...`).
- A server endpoint that exchanges an ephemeral key **nonce** for an **ephemeral key** for that card (see the [guide](/guide/issuing#_1-server-create-the-ephemeral-key)).
- `<VueStripeElements>` with no `clientSecret` and no `mode`: Issuing Elements do not take part in a payment.
- They are not available inside `<VueStripeCheckoutElementsProvider>` (Checkout Sessions have no Issuing Elements); there the component shows a "not available inside Checkout Sessions" error.

## Usage

Create the nonce and the ephemeral key first, then render the elements. The components create their Stripe element when they mount, so render them only once `nonce` and `ephemeralKeySecret` are known.

```vue
<!-- IssuedCard.vue, rendered inside <VueStripeProvider> -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  useEphemeralKeyNonce,
  VueStripeElements,
  VueStripeIssuingCardNumberDisplayElement,
  VueStripeIssuingCardExpiryDisplayElement,
  VueStripeIssuingCardCvcDisplayElement,
  VueStripeIssuingCardCopyButtonElement
} from '@vue-stripe/vue-stripe'

const props = defineProps<{ cardId: string }>()
const { createEphemeralKeyNonce } = useEphemeralKeyNonce()
const card = ref<{ issuingCard: string; nonce: string; ephemeralKeySecret: string } | null>(null)

onMounted(async () => {
  const { nonce, error } = await createEphemeralKeyNonce({ issuingCard: props.cardId })
  if (error) throw error
  const response = await fetch('/api/issuing/ephemeral-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId: props.cardId, nonce })
  })
  const { ephemeralKeySecret } = await response.json()
  card.value = { issuingCard: props.cardId, nonce: nonce!, ephemeralKeySecret }
})

const style = { base: { color: '#ffffff', fontSize: '16px' } }
</script>

<template>
  <VueStripeElements v-if="card">
    <div class="card-row">
      <VueStripeIssuingCardNumberDisplayElement :options="{ ...card, style }" />
      <div class="copy-icon">
        <VueStripeIssuingCardCopyButtonElement :options="{ toCopy: 'number' }" />
      </div>
    </div>
    <VueStripeIssuingCardExpiryDisplayElement :options="{ ...card, style }" />
    <VueStripeIssuingCardCvcDisplayElement :options="{ ...card, style }" />
  </VueStripeElements>
</template>
```

::: warning Retrieve the card first when Stripe asks for it
Stripe's guide calls `stripe.retrieveIssuingCard(cardId, { ephemeralKeySecret, nonce })` before creating Issuing Elements, and requires it with the `issuing_elements_2` beta (Connect, physical card details): without it element creation fails with "Issuing card has not been retrieved." Stripe.js 10.0.0 does not declare `retrieveIssuingCard` in its types; see the [guide](/guide/issuing#_3-client-retrieve-the-card) for a typed call.
:::

## Props

Every Issuing component has the same props interface:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | Yes (Stripe requires the card or `toCopy` options) | Options passed to `elements.create()`; see below |

::: info Updating options
Changes to `options` are applied to the mounted element with `element.update()`, and only when they really change: a re-render that passes a new but deep-equal object (e.g. an inline `:options="{ ... }"`) does not call `update()`. Ephemeral keys expire after 15 minutes: fetch a new nonce and key and pass them in `options` to refresh a display.
:::

### Options Object

```ts
// Number, CVC, expiry and PIN displays (StripeIssuingCard*DisplayElementOptions)
interface IssuingCardDisplayOptions {
  issuingCard: string          // 'ic_...'
  nonce?: string               // from useEphemeralKeyNonce().createEphemeralKeyNonce()
  ephemeralKeySecret?: string  // secret of the ephemeral key minted for that nonce
  style?: StripeElementStyle   // input-only parts (e.g. ::placeholder) do not apply
}

// Copy button (StripeIssuingCardCopyButtonElementOptions)
interface IssuingCardCopyButtonOptions {
  toCopy: 'number' | 'cvc' | 'expiry' | 'pin'
  style?: StripeElementStyle
}

// Add to Wallet button (StripeIssuingAddToWalletButtonElementOptions)
interface IssuingAddToWalletButtonOptions {
  issuingCard: string
  nonce: string
  ephemeralKeySecret: string
  wallet: 'apple'              // Stripe.js 10.0.0 types; Stripe's guide also lists 'google'
  buttonHeight?: number        // 36 to 55, default 44
}
```

`nonce` and `ephemeralKeySecret` are optional in the display types, but Stripe needs them to fetch the card details: always pass both.

## Events

### VueStripeIssuingCardNumberDisplayElement

| Event | Payload | Description |
|-------|---------|-------------|
| `@ready` | `StripeIssuingCardNumberDisplayElement` | The number display is rendered (payload: the Stripe element) |

### VueStripeIssuingCardCopyButtonElement

| Event | Payload | Description |
|-------|---------|-------------|
| `@click` | `{ elementType: 'issuingCardCopyButton' }` | The button was clicked and the detail copied; show your "Copied" feedback here |

### VueStripeIssuingAddToWalletButtonElement

| Event | Payload | Description |
|-------|---------|-------------|
| `@click` | `{ elementType: 'issuingAddToWalletButton' }` | The button was clicked |
| `@success` | `{ elementType: 'issuingAddToWalletButton' }` | The add-to-wallet flow completed |

The CVC, expiry and PIN displays emit no events.

## Slots

| Slot | Slot Props | Description |
|------|-----------|-------------|
| `#loading` | - | Rendered while the element is loading. Only the number display waits for `ready`; the others are shown once mounted |
| `#error` | `{ error: string }` | Rendered when the element could not be created (for example inside a Checkout Session) |

The `#error` slot shows errors thrown by `elements.create()`, such as "Issuing card ic_... has not been retrieved." Once a display is mounted, Stripe.js fetches the card inside its iframe; a failed fetch (wrong or expired ephemeral key, unknown card) is only logged to the browser console, because Stripe.js 10 declares no error event for these elements.

## Exposed Methods & Properties

Access via template ref. Every Issuing component exposes the same members:

| Member | Type | Description |
|--------|------|-------------|
| `element` | `ShallowRef<StripeIssuingCardNumberDisplayElement \| null>` (the matching `StripeIssuing*Element` type for the others) | The Stripe element instance (`null` until created) |
| `loading` | `Ref<boolean>` | `true` until the number display emits `ready`; `false` once the other elements are mounted |
| `error` | `Ref<string \| null>` | Creation error, if any |
| `focus()` | `() => void` | Calls `element.focus()` when the element supports it |
| `blur()` | `() => void` | Calls `element.blur()` when the element supports it |
| `clear()` | `() => void` | Calls `element.clear()` when the element supports it |

The component owns the element's lifecycle: it creates, mounts and destroys the element. Removing the component (for example with `v-if`) destroys the element, which takes the place of Stripe's `element.unmount()`; for a one-time listener use Vue's `.once` modifier (`@ready.once`) instead of `element.once()`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueStripeIssuingCardNumberDisplayElement } from '@vue-stripe/vue-stripe'
import type { StripeIssuingCardNumberDisplayElement } from '@vue-stripe/vue-stripe'

const numberRef = ref<InstanceType<typeof VueStripeIssuingCardNumberDisplayElement> | null>(null)
const number = (): StripeIssuingCardNumberDisplayElement | null => numberRef.value?.element ?? null
</script>
```

## Copy Button Feedback

The copy button renders a transparent iframe over its parent `<div>`. Size and decorate the parent yourself, and use `@click` to show feedback:

```vue
<script setup>
import { ref } from 'vue'
import { VueStripeIssuingCardCopyButtonElement } from '@vue-stripe/vue-stripe'

const copied = ref(false)
const onCopied = () => {
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="copy-icon" :class="{ copied }">
    <VueStripeIssuingCardCopyButtonElement :options="{ toCopy: 'number' }" @click="onCopied" />
  </div>
</template>

<style scoped>
.copy-icon {
  position: relative;
  width: 24px;
  height: 24px;
}
</style>
```

## Add to Wallet

`issuingAddToWalletButton` is a Stripe private preview. Load Stripe with the betas Stripe lists for it:

```vue
<VueStripeProvider
  :publishable-key="publishableKey"
  :betas="['issuing_add_to_wallet_button_element_1', 'issuing_elements_2']"
>
  <VueStripeElements v-if="card">
    <VueStripeIssuingAddToWalletButtonElement
      :options="{ ...card, wallet: 'apple', buttonHeight: 50 }"
      @click="onWalletClick"
      @success="onAddedToWallet"
    />
  </VueStripeElements>
</VueStripeProvider>
```

Without those betas Stripe.js rejects the type when the component creates it ("A valid Element name must be provided ... you passed: issuingAddToWalletButton"), and the component shows that message in its `#error` slot.

Stripe.js 10.0.0 lists `'issuingAddToWalletButton'` in `StripeElementType` but has no typed `elements.create()` overload for it. The component creates it by type name and still types its `options`, `element` and events with `StripeIssuingAddToWalletButtonElementOptions` / `StripeIssuingAddToWalletButtonElement`.

## Styling

Each component renders this markup around Stripe's iframe (`<type>` is `issuing-card-number-display`, `issuing-card-cvc-display`, `issuing-card-expiry-display`, `issuing-card-pin-display`, `issuing-card-copy-button` or `issuing-add-to-wallet-button`):

```html
<div class="vue-stripe-<type>-element vue-stripe-element">
  <!-- only when there is an error (#error slot) -->
  <div class="vue-stripe-<type>-element-error vue-stripe-element-error">...</div>
  <!-- Stripe mounts its iframe here; plus -loading classes while loading -->
  <div class="vue-stripe-<type>-element-mount vue-stripe-element-mount"></div>
  <!-- only while loading (#loading slot) -->
  <div class="vue-stripe-<type>-element-loader vue-stripe-element-loader">...</div>
</div>
```

The default styles ship in the package stylesheet (`import '@vue-stripe/vue-stripe/style.css'`). Style the text inside the iframes with `options.style`.

## TypeScript

```ts
import type {
  StripeIssuingCardNumberDisplayElement,
  StripeIssuingCardNumberDisplayElementOptions,
  StripeIssuingCardCvcDisplayElement,
  StripeIssuingCardCvcDisplayElementOptions,
  StripeIssuingCardExpiryDisplayElement,
  StripeIssuingCardExpiryDisplayElementOptions,
  StripeIssuingCardPinDisplayElement,
  StripeIssuingCardPinDisplayElementOptions,
  StripeIssuingCardCopyButtonElement,
  StripeIssuingCardCopyButtonElementOptions,
  StripeIssuingAddToWalletButtonElement,
  StripeIssuingAddToWalletButtonElementOptions
} from '@vue-stripe/vue-stripe'
```

## See Also

- [Issuing Elements guide](/guide/issuing) - the nonce and ephemeral key flow
- [VueStripeElements](/api/components/stripe-elements) - the Elements group the components need
- [useEphemeralKeyNonce](/api/composables/use-ephemeral-key-nonce) - creates the nonce with `createEphemeralKeyNonce()`
- [Stripe docs: Using Issuing Elements](https://docs.stripe.com/issuing/elements)
