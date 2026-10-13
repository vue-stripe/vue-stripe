<script setup lang="ts">
// Type fixture: the reference pages' snippets, type-checked with vue-tsc against the
// built dist/types on Vue 2.7 (tsconfig.vue2*.json) and Vue 3 (tsconfig.vue3*.json).
// `@vue-expect-error` / `@ts-expect-error` lines are wrong on purpose, and every event
// payload goes through `payload<T>()`: the check fails if a prop, event payload or
// exposed member loses its type (becomes `any`) or has a different one.
import { ref } from 'vue'
import {
  VueStripeCheckout,
  VueStripeCheckoutError,
  VueStripeCheckoutFormProvider,
  VueStripeCheckoutProvider,
  VueStripeElements,
  VueStripeEmbeddedCheckout,
  VueStripeFinancialAccountDisclosure,
  VueStripeIssuingDisclosure,
  VueStripePaymentElement,
  VueStripePricingTable,
  VueStripeProvider,
  VueStripeTreasuryDisclosure,
  useConfirmCardPayment,
  type DisclosureError,
  type Stripe,
  type StripeCheckoutFormLoadActionsSuccess,
  type StripeCheckoutLoadActionsSuccess,
  type StripeCheckoutSession,
  type StripeElements,
  type StripeEmbeddedCheckout,
  type StripeEmbeddedCheckoutAnalyticsEventUnion,
  type StripePaymentElementChangeEvent
} from '@vue-stripe/vue-stripe'

const pk = 'pk_test_123'
const sessionUrl = ref('https://checkout.stripe.com/c/pay/cs_test_123')
const seen: unknown[] = []
const log = (...args: unknown[]) => seen.push(...args)
// Accepts a value of type T (or narrower), and rejects `any`.
const payload =
  <T,>() =>
  <A,>(value: A & (0 extends 1 & A ? never : T)) =>
    log(value)
const isStripe = payload<Stripe>()
const isElements = payload<StripeElements>()
const isError = payload<Error>()
const isString = payload<string>()
const isElementChange = payload<StripePaymentElementChangeEvent>()
const isCheckoutError = payload<VueStripeCheckoutError>()
const isRedirect = payload<{ url: string }>()
const isEmbedded = payload<StripeEmbeddedCheckout>()
const isAnalytics = payload<StripeEmbeddedCheckoutAnalyticsEventUnion>()
const isDisclosureError = payload<DisclosureError>()
const isCheckoutActions = payload<StripeCheckoutLoadActionsSuccess>()
const isFormActions = payload<StripeCheckoutFormLoadActionsSuccess>()
const isSession = payload<StripeCheckoutSession>()

// VueStripeCheckout: Exposed Methods
const checkoutRef = ref<InstanceType<typeof VueStripeCheckout> | null>(null)
const triggerCheckout = () => {
  checkoutRef.value?.checkout()
}
const redirecting: boolean | undefined = checkoutRef.value?.loading

// VueStripePricingTable: Exposed Properties
const pricingTableRef = ref<InstanceType<typeof VueStripePricingTable> | null>(null)
const tableLoading: boolean | undefined = pricingTableRef.value?.loading
const tableError: string | null | undefined = pricingTableRef.value?.error

// VueStripeEmbeddedCheckout: Exposed Properties
const embeddedRef = ref<InstanceType<typeof VueStripeEmbeddedCheckout> | null>(null)
const embedded: StripeEmbeddedCheckout | null | undefined = embeddedRef.value?.checkout
const embeddedLoading: boolean | undefined = embeddedRef.value?.loading
const embeddedError: string | null | undefined = embeddedRef.value?.error

// Disclosures: Exposed Properties
const issuingRef = ref<InstanceType<typeof VueStripeIssuingDisclosure> | null>(null)
const financialRef = ref<InstanceType<typeof VueStripeFinancialAccountDisclosure> | null>(null)
const treasuryRef = ref<InstanceType<typeof VueStripeTreasuryDisclosure> | null>(null)
const disclosureLoading: boolean | undefined = issuingRef.value?.loading
const disclosureError: string | null | undefined =
  financialRef.value?.error ?? treasuryRef.value?.error

// A method composable (utils/method-factory)
const { confirmCardPayment, loading: confirming } = useConfirmCardPayment()
const confirmingNow: boolean = confirming.value

// Members the components do not have
// @ts-expect-error VueStripeCheckout exposes no `element`
log(checkoutRef.value?.element)
// @ts-expect-error VueStripePricingTable exposes no `checkout`
log(pricingTableRef.value?.checkout)
// @ts-expect-error VueStripeEmbeddedCheckout exposes no `focus`
log(embeddedRef.value?.focus)
// @ts-expect-error disclosures expose no `checkout`
log(issuingRef.value?.checkout)

log(
  triggerCheckout,
  redirecting,
  tableLoading,
  tableError,
  embedded,
  embeddedLoading,
  embeddedError,
  disclosureLoading,
  disclosureError,
  confirmCardPayment,
  confirmingNow
)
</script>

<template>
  <div>
    <VueStripeProvider
      :publishable-key="pk"
      @load="(stripe) => isStripe(stripe)"
      @error="(e) => isError(e)"
    >
      <VueStripeElements
        mode="payment"
        currency="usd"
        :amount="1099"
        @ready="(elements) => isElements(elements)"
        @error="(message) => isString(message)"
        @update-end="() => log('updated')"
      >
        <VueStripePaymentElement @change="(event) => isElementChange(event)" />
      </VueStripeElements>

      <VueStripeCheckout
        ref="checkoutRef"
        :session-url="sessionUrl"
        @before-redirect="(e) => isRedirect(e)"
        @error="(e) => isCheckoutError(e)"
      />
      <VueStripePricingTable
        ref="pricingTableRef"
        pricing-table-id="prctbl_123"
        @error="(e) => isError(e)"
      />
      <VueStripeEmbeddedCheckout
        ref="embeddedRef"
        client-secret="cs_test_123_secret_456"
        @ready="(page) => isEmbedded(page)"
        @analytics="(event) => isAnalytics(event)"
        @error="(message) => isString(message)"
      />
      <VueStripeIssuingDisclosure
        ref="issuingRef"
        :options="{ issuingProgramID: 'iprg_123' }"
        @error="(e) => isDisclosureError(e)"
      />
      <VueStripeFinancialAccountDisclosure ref="financialRef" />
      <VueStripeTreasuryDisclosure ref="treasuryRef" />
      <VueStripeCheckoutProvider
        client-secret="cs_test_123_secret_456"
        @ready="(actions) => isCheckoutActions(actions)"
        @change="(session) => isSession(session)"
        @error="(message) => isString(message)"
      />
      <VueStripeCheckoutFormProvider
        client-secret="cs_test_123_secret_456"
        @ready="(actions) => isFormActions(actions)"
        @change="(session) => isSession(session)"
        @error="(message) => isString(message)"
      />
    </VueStripeProvider>

    <!-- Wrong prop types (#560) -->
    <!-- @vue-expect-error publishableKey is a string -->
    <VueStripeProvider :publishable-key="123" />
    <!-- @vue-expect-error clientSecret is a string -->
    <VueStripeElements :client-secret="456" />
    <!-- @vue-expect-error mode is 'payment' | 'setup' | 'subscription' -->
    <VueStripeElements mode="nonsense" />
    <!-- @vue-expect-error options is an object -->
    <VueStripePaymentElement :options="789" />
    <!-- @vue-expect-error sessionUrl is a string -->
    <VueStripeCheckout :session-url="1" />
    <!-- @vue-expect-error pricingTableId is a string -->
    <VueStripePricingTable :pricing-table-id="1" />
    <!-- @vue-expect-error clientSecret is a string -->
    <VueStripeEmbeddedCheckout :client-secret="1" />
    <!-- @vue-expect-error clientSecret is a string or a Promise -->
    <VueStripeCheckoutProvider :client-secret="1" />
    <!-- @vue-expect-error clientSecret is a string or a Promise -->
    <VueStripeCheckoutFormProvider :client-secret="1" />
    <!-- @vue-expect-error options is an object -->
    <VueStripeIssuingDisclosure :options="1" />
  </div>
</template>
