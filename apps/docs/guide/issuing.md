# Issuing Elements

If you issue cards with [Stripe Issuing](https://docs.stripe.com/issuing), your cardholders need to see their card details. Issuing Elements show the card number, CVC, expiry date and PIN inside Stripe-hosted iframes, so the details never pass through your page or your server and stay out of your PCI scope.

Vue Stripe wraps the six Issuing elements as components. Their reference is on one page: [Issuing Elements API](/api/components/stripe-issuing-elements).

| Component | Shows |
|-----------|-------|
| `VueStripeIssuingCardNumberDisplayElement` | Card number |
| `VueStripeIssuingCardCvcDisplayElement` | CVC |
| `VueStripeIssuingCardExpiryDisplayElement` | Expiry date |
| `VueStripeIssuingCardPinDisplayElement` | PIN |
| `VueStripeIssuingCardCopyButtonElement` | A copy-to-clipboard button for one of the above |
| `VueStripeIssuingAddToWalletButtonElement` | An Add to Wallet button (Stripe private preview) |

## How It Works

Stripe.js fetches the card details with an **ephemeral key**: a short-lived key, scoped to one card, that your server creates with your secret key. The browser proves it asked for that key with a single-use **nonce**.

```mermaid
sequenceDiagram
    participant B as Browser (Stripe.js)
    participant S as Your server
    participant API as Stripe API
    B->>B: stripe.createEphemeralKeyNonce({ issuingCard })
    B->>S: POST { cardId, nonce } (authenticated user)
    S->>S: Check the user owns the card
    S->>API: ephemeralKeys.create({ nonce, issuing_card })
    API-->>S: ephemeral key
    S-->>B: { ephemeralKeySecret }
    B->>B: Render the Issuing components with { issuingCard, nonce, ephemeralKeySecret }
    B->>API: Stripe-hosted iframes fetch the card details
```

You need Issuing enabled on your Stripe account and an issued card (`ic_...`). In a sandbox, test cards created in the Dashboard or with the API work; there every card shows its number and CVC. In live mode the number and CVC are available for virtual cards only, unless Stripe enables physical card details for your account.

## 1. Server: create the ephemeral key

Your endpoint receives the card ID and the nonce, checks that the signed-in user may see that card, and returns the ephemeral key secret. Stripe needs API version `2020-03-02` or later for the key; Stripe's own example pins `2026-09-30.endive`, the Endive release that Stripe.js 10 belongs to.

```ts
// POST /api/issuing/ephemeral-keys (Node, stripe-node)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createIssuingEphemeralKey(user: { id: string }, body: { cardId: string; nonce: string }) {
  // Important: only the card's own cardholder may get a key for it.
  await assertUserOwnsCard(user.id, body.cardId)

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { nonce: body.nonce, issuing_card: body.cardId },
    { apiVersion: '2026-09-30.endive' }
  )
  return { ephemeralKeySecret: ephemeralKey.secret }
}
```

::: danger Authenticate this endpoint
Anyone who can call it for a card ID can read that card's number and CVC. Check the session and the card's owner before you create the key. To show the PIN, Stripe also requires two-factor authentication before the page that renders `VueStripeIssuingCardPinDisplayElement`.
:::

## 2. Client: create the nonce and fetch the key

Create the nonce with [`useEphemeralKeyNonce()`](/api/composables/use-ephemeral-key-nonce), which wraps `stripe.createEphemeralKeyNonce()`, in a component inside `<VueStripeProvider>`. It returns Stripe's result untouched and tracks `loading` and `error`.

```ts
import { useEphemeralKeyNonce } from '@vue-stripe/vue-stripe'

const { createEphemeralKeyNonce } = useEphemeralKeyNonce()

async function loadIssuingCard(cardId: string) {
  const { nonce, error } = await createEphemeralKeyNonce({ issuingCard: cardId })
  if (error) throw new Error(error.message)

  const response = await fetch('/api/issuing/ephemeral-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, nonce })
  })
  const { ephemeralKeySecret } = await response.json()
  return { issuingCard: cardId, nonce: nonce!, ephemeralKeySecret: ephemeralKeySecret as string }
}
```

## 3. Client: retrieve the card

Stripe's guide calls `stripe.retrieveIssuingCard()` with the key before it creates Issuing Elements; with the `issuing_elements_2` beta (Connect, physical card details) element creation fails without it ("Issuing card has not been retrieved."). Stripe.js 10.0.0 does not declare this method, so call it on the Stripe instance from [`useStripe()`](/api/composables/use-stripe) through a narrow type:

```ts
import { useStripe } from '@vue-stripe/vue-stripe'

const { stripe } = useStripe()

type RetrieveIssuingCard = (
  cardId: string,
  options: { ephemeralKeySecret: string; nonce: string }
) => Promise<unknown>

async function retrieveIssuingCard(card: { issuingCard: string; nonce: string; ephemeralKeySecret: string }) {
  const retrieve = (stripe.value as unknown as { retrieveIssuingCard?: RetrieveIssuingCard })
    .retrieveIssuingCard
  await retrieve?.call(stripe.value, card.issuingCard, {
    ephemeralKeySecret: card.ephemeralKeySecret,
    nonce: card.nonce
  })
}
```

## 4. Render the elements

The components create their Stripe element when they mount, so render `<VueStripeElements>` only after the key is there. It needs no `clientSecret` and no `mode`.

```vue
<!-- IssuedCard.vue: render it inside <VueStripeProvider> -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  VueStripeElements,
  VueStripeIssuingCardNumberDisplayElement,
  VueStripeIssuingCardExpiryDisplayElement,
  VueStripeIssuingCardCvcDisplayElement,
  VueStripeIssuingCardCopyButtonElement
} from '@vue-stripe/vue-stripe'
// loadIssuingCard() and retrieveIssuingCard() from steps 2 and 3

const props = defineProps<{ cardId: string }>()
const card = ref<{ issuingCard: string; nonce: string; ephemeralKeySecret: string } | null>(null)
const copied = ref(false)

onMounted(async () => {
  const loaded = await loadIssuingCard(props.cardId)
  await retrieveIssuingCard(loaded)
  card.value = loaded
})

const style = { base: { color: '#ffffff', fontSize: '18px', letterSpacing: '0.08em' } }

const onCopied = () => {
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <p v-if="!card">Loading card...</p>
  <VueStripeElements v-else>
    <div class="issued-card">
      <div class="number">
        <VueStripeIssuingCardNumberDisplayElement :options="{ ...card, style }" />
        <div class="copy" :title="copied ? 'Copied' : 'Copy number'">
          <VueStripeIssuingCardCopyButtonElement
            :options="{ toCopy: 'number' }"
            @click="onCopied"
          />
        </div>
      </div>
      <div class="meta">
        <VueStripeIssuingCardExpiryDisplayElement :options="{ ...card, style }" />
        <VueStripeIssuingCardCvcDisplayElement :options="{ ...card, style }" />
      </div>
    </div>
  </VueStripeElements>
</template>

<style scoped>
.issued-card {
  padding: 24px;
  border-radius: 12px;
  background: #1a1f36;
}
.number {
  display: flex;
  align-items: center;
  gap: 12px;
}
.copy {
  position: relative;
  width: 24px;
  height: 24px;
}
.meta {
  display: flex;
  gap: 24px;
  margin-top: 16px;
}
</style>
```

The copy button is a transparent iframe that fills its parent: give the parent a size and an icon, and use `@click` for "Copied" feedback.

## Refreshing the key

Ephemeral keys expire after 15 minutes. For longer sessions, run steps 2 and 3 again and assign the new values to `card`: each component passes the changed `options` to `element.update()`.

```ts
import { onUnmounted } from 'vue'

const timer = setInterval(async () => {
  const fresh = await loadIssuingCard(props.cardId)
  await retrieveIssuingCard(fresh)
  card.value = fresh
}, 14 * 60 * 1000)
onUnmounted(() => clearInterval(timer))
```

## Showing the PIN

`VueStripeIssuingCardPinDisplayElement` takes the same options as the other displays. Stripe requires you to put two-factor authentication in front of any page that shows a PIN, and may suspend access to the element otherwise. Issuing Elements do not integrate with Stripe's Issuing verifications, so the 2FA step is yours to build.

## Add to Wallet

`VueStripeIssuingAddToWalletButtonElement` is a Stripe private preview. Pass the betas Stripe lists for it on the provider, and the same card options plus `wallet`:

```vue
<VueStripeProvider
  :publishable-key="publishableKey"
  :betas="['issuing_add_to_wallet_button_element_1', 'issuing_elements_2']"
>
  <IssuedCardWallet :card-id="cardId" />
</VueStripeProvider>
```

```vue
<VueStripeElements v-if="card">
  <VueStripeIssuingAddToWalletButtonElement
    :options="{ ...card, wallet: 'apple' }"
    @click="onWalletClick"
    @success="onAddedToWallet"
  />
</VueStripeElements>
```

`@success` fires when the wallet flow completes. Follow Apple's and Google's badge guidelines when you place the button.

## Connect

To show cards of a connected account, set `stripe-account` on `<VueStripeProvider>` and create the ephemeral key with the `stripeAccount` request option on your server. Stripe must enable Issuing Elements for connected accounts first; ask Stripe support.

## See Also

- [Issuing Elements API](/api/components/stripe-issuing-elements) - props, events, slots and exposed members
- [Architecture](/guide/architecture) - how the provider and Elements context reach the components
- [Stripe docs: Using Issuing Elements](https://docs.stripe.com/issuing/elements)
