<script setup lang="ts">
// Type fixture: the slots tables of the reference pages, type-checked with vue-tsc against
// the built dist/types on Vue 2.7 and Vue 3 (#671). Every slot prop goes through
// `payload<T>()`, which rejects `any`; `@vue-expect-error` lines are wrong on purpose.
import {
  VueStripeCardElement,
  VueStripeCheckout,
  VueStripeCheckoutFormProvider,
  VueStripeCheckoutProvider,
  VueStripeElements,
  VueStripeEmbeddedCheckout,
  VueStripeIssuingDisclosure,
  VueStripePaymentElement,
  VueStripePricingTable,
  VueStripeProvider,
  type StripeCheckoutElementsSdk,
  type StripeCheckoutFormLoadActionsSuccess,
  type StripeCheckoutFormSdk,
  type StripeCheckoutLoadActionsSuccess,
  type StripeCheckoutSession
} from '@vue-stripe/vue-stripe'

const seen: unknown[] = []
const log = (...args: unknown[]) => seen.push(...args)
// Accepts a value of type T (or narrower), and rejects `any`.
const payload =
  <T,>() =>
  <A,>(value: A & (0 extends 1 & A ? never : T)) =>
    log(value)
const isString = payload<string>()
const isBoolean = payload<boolean>()
const isNumber = payload<number>()
const isFunction = payload<() => void>()
const isCheckoutSdk = payload<StripeCheckoutElementsSdk>()
const isFormSdk = payload<StripeCheckoutFormSdk>()
const isCheckoutActions = payload<StripeCheckoutLoadActionsSuccess | null>()
const isFormActions = payload<StripeCheckoutFormLoadActionsSuccess | null>()
const isSession = payload<StripeCheckoutSession | null>()
</script>

<template>
  <div>
    <VueStripeProvider publishable-key="pk_test_123">
      <template #loading>Loading Stripe</template>
      <template #error="{ error }">{{ isString(error) }}</template>

      <VueStripeElements mode="payment" currency="usd" :amount="1099">
        <template #loading>Loading Elements</template>
        <template #error="{ error }">{{ isString(error) }}</template>
        <VueStripePaymentElement>
          <template #loading>Loading the Payment Element</template>
          <template #error="{ error }">{{ isString(error) }}</template>
        </VueStripePaymentElement>
        <VueStripeCardElement>
          <template #error="{ error }">{{ isString(error) }}</template>
        </VueStripeCardElement>
      </VueStripeElements>

      <VueStripeCheckoutProvider client-secret="cs_test_123_secret_456">
        <template #loading>Loading Checkout</template>
        <template #error="{ error }">{{ isString(error) }}</template>
        <template #default="{ checkout, actions, session, loading }">
          {{ isCheckoutSdk(checkout) }} {{ isCheckoutActions(actions) }} {{ isSession(session) }}
          {{ isBoolean(loading) }}
          <p v-if="session">{{ isNumber(session.total.total.minorUnitsAmount) }}</p>
        </template>
      </VueStripeCheckoutProvider>

      <VueStripeCheckoutFormProvider client-secret="cs_test_123_secret_456">
        <template #error="{ error }">{{ isString(error) }}</template>
        <template #default="{ checkout, actions, session, loading }">
          {{ isFormSdk(checkout) }} {{ isFormActions(actions) }} {{ isSession(session) }}
          {{ isBoolean(loading) }}
        </template>
      </VueStripeCheckoutFormProvider>

      <VueStripeEmbeddedCheckout client-secret="cs_test_123_secret_456">
        <template #loading>Loading Embedded Checkout</template>
        <template #error="{ error }">{{ isString(error) }}</template>
      </VueStripeEmbeddedCheckout>
      <VueStripePricingTable pricing-table-id="prctbl_123">
        <template #loading>Loading the pricing table</template>
        <template #error="{ error }">{{ isString(error) }}</template>
      </VueStripePricingTable>
      <VueStripeIssuingDisclosure>
        <template #error="{ error }">{{ isString(error) }}</template>
      </VueStripeIssuingDisclosure>
    </VueStripeProvider>

    <VueStripeCheckout session-url="https://checkout.stripe.com/c/pay/cs_test_123">
      <template #default="{ checkout, loading, disabled }">
        <button :disabled="disabled" @click="checkout">
          {{ isFunction(checkout) }} {{ isBoolean(loading) }} {{ isBoolean(disabled) }}
        </button>
      </template>
    </VueStripeCheckout>

    <!-- Wrong slot props -->
    <VueStripeCheckoutProvider client-secret="cs_test_123_secret_456">
      <!-- @vue-expect-error the default slot has no `bogus` prop -->
      <template #default="{ bogus }">{{ bogus }}</template>
    </VueStripeCheckoutProvider>
    <VueStripeCheckoutProvider client-secret="cs_test_123_secret_456">
      <template #default="{ session }">
        <p v-if="session">
          <!-- @vue-expect-error a session has no `nope` -->
          {{ session.nope }}
        </p>
        <p>
          <!-- @vue-expect-error session is null until the actions load -->
          {{ session.total }}
        </p>
      </template>
    </VueStripeCheckoutProvider>
    <VueStripeCheckoutFormProvider client-secret="cs_test_123_secret_456">
      <template #default="{ actions }">
        <p>
          <!-- @vue-expect-error actions is null until they load -->
          {{ actions.getSession() }}
        </p>
      </template>
    </VueStripeCheckoutFormProvider>
    <VueStripePricingTable pricing-table-id="prctbl_123">
      <!-- @vue-expect-error the error slot has no `bogus` prop -->
      <template #error="{ bogus }">{{ bogus }}</template>
    </VueStripePricingTable>
    <VueStripePricingTable pricing-table-id="prctbl_123">
      <template #error="{ error }">
        <!-- @vue-expect-error the error is a string -->
        {{ error.nope }}
      </template>
    </VueStripePricingTable>
    <VueStripePaymentElement>
      <!-- @vue-expect-error the loading slot has no props -->
      <template #loading="{ bogus }">{{ bogus }}</template>
    </VueStripePaymentElement>
    <VueStripeProvider publishable-key="pk_test_123">
      <!-- @vue-expect-error the default slot has no props -->
      <template #default="{ stripe }">{{ stripe }}</template>
    </VueStripeProvider>
  </div>
</template>
