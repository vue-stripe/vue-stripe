<script setup lang="ts">
// Rendered inside VueStripeCheckoutElementsProvider: the element components detect the
// Checkout provider and use the Checkout Elements SDK creators instead of stripe.elements().
import { computed, ref, watch } from 'vue'
import {
  VueStripePaymentElement,
  VueStripeAddressElement,
  VueStripeExpressCheckoutElement,
  VueStripeCurrencySelectorElement,
  VueStripeTaxIdElement,
  VueStripeContactDetailsElement,
  VueStripeTermsElement,
  VueStripeLinkSignupElement,
  useCheckoutSession,
  type StripeContactDetailsElementChangeEvent
} from '@vue-stripe/vue-stripe'
import { Button, Input, Label, Badge } from '@/components/ui'

const props = defineProps<{
  /** Render the Tax ID element (needs the Tax ID beta on the Stripe instance). */
  taxId: boolean
  /** Collect the email with the Contact Details element instead of updateEmail(). */
  contactDetails?: boolean
  /** Render the Terms element (Stripe beta, gated on the account). */
  terms?: boolean
  /** Render the Link Signup element (Stripe beta flag on the Stripe instance). */
  linkSignup?: boolean
}>()

const emit = defineEmits<{
  log: [event: string, data?: string]
}>()

const { session, loading, error, confirm, updateEmail, applyPromotionCode } = useCheckoutSession()

const email = ref('')
const promo = ref('')
const confirming = ref(false)
const result = ref<string | null>(null)

const total = computed(() => session.value?.total.total.amount ?? '')
const canConfirm = computed(() => session.value?.canConfirm ?? false)
// The selector has something to show only when Adaptive Pricing offers other currencies.
const hasCurrencyOptions = computed(() => (session.value?.currencyOptions?.length ?? 0) > 1)

// Stripe sets canConfirm to false while a session update (email, address, promo, currency)
// is in flight and back to true once it settles. Log each flip so the toggle is visible.
watch(canConfirm, (next, prev) => {
  if (session.value) emit('log', 'canConfirm', `${prev} -> ${next}`)
})

const onUpdateEmail = async () => {
  const res = await updateEmail(email.value)
  result.value = res.type === 'error' ? `Error: ${res.error.message}` : 'Email updated'
  emit('log', 'updateEmail', res.type)
}

const onApplyPromo = async () => {
  const res = await applyPromotionCode(promo.value)
  result.value = res.type === 'error' ? `Error: ${res.error.message}` : 'Promotion code applied'
  emit('log', 'applyPromotionCode', res.type)
}

const onContactDetailsChange = (event: StripeContactDetailsElementChangeEvent) =>
  emit(
    'log',
    'contactDetails change',
    `${event.value.email || '(empty)'}, complete ${event.complete}`
  )

// Stripe's loaderror payload: { elementType, error: { message } }.
const onLoadError = (event: { elementType: string; error: { message?: string } }) =>
  emit('log', `${event.elementType} loaderror`, event.error.message)

// No returnUrl: the session was created with return_url, and Stripe rejects a second one.
// redirect: 'if_required' keeps card payments on this page.
const onConfirm = async () => {
  confirming.value = true
  result.value = null
  const res = await confirm({ redirect: 'if_required' })
  confirming.value = false
  result.value =
    res.type === 'error'
      ? `Error: ${res.error.message}`
      : `Status: ${res.session.status.type}, ${res.session.total.total.amount}`
  emit('log', 'confirm', res.type === 'error' ? res.error.message : res.session.status.type)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Live session snapshot -->
    <div class="rounded-lg border bg-secondary p-4 text-sm" data-test="session-state">
      <div class="mb-2 flex items-center justify-between">
        <span class="font-semibold">Session</span>
        <Badge :variant="canConfirm ? 'default' : 'secondary'" data-test="can-confirm">
          canConfirm: {{ canConfirm }}
        </Badge>
      </div>
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt class="text-muted-foreground">status</dt>
        <dd>{{ session?.status.type ?? '-' }}</dd>
        <dt class="text-muted-foreground">total</dt>
        <dd>{{ total || '-' }}</dd>
        <dt class="text-muted-foreground">currency</dt>
        <dd>{{ session?.currency?.toUpperCase() ?? '-' }}</dd>
        <dt class="text-muted-foreground">email</dt>
        <dd>{{ session?.email ?? '-' }}</dd>
        <dt class="text-muted-foreground">line items</dt>
        <dd>
          <span v-for="item in session?.lineItems ?? []" :key="item.id" class="block">
            {{ item.quantity }} x {{ item.name }}
          </span>
        </dd>
      </dl>
    </div>

    <div v-if="hasCurrencyOptions" data-test="currency-selector">
      <Label class="mb-2 block">Currency (Adaptive Pricing)</Label>
      <VueStripeCurrencySelectorElement />
    </div>

    <div data-test="express-checkout-element">
      <Label class="mb-2 block">Express Checkout</Label>
      <VueStripeExpressCheckoutElement />
    </div>

    <div v-if="props.contactDetails" data-test="contact-details-element">
      <Label class="mb-2 block">Contact details</Label>
      <VueStripeContactDetailsElement
        @ready="emit('log', 'contactDetails ready')"
        @change="onContactDetailsChange"
        @loaderror="onLoadError"
      />
    </div>

    <div v-else>
      <Label for="cs-email" class="mb-2 block">Email</Label>
      <div class="flex gap-2">
        <Input
          id="cs-email"
          v-model="email"
          type="email"
          placeholder="customer@email.com"
          class="flex-1"
        />
        <Button variant="outline" data-test="update-email" @click="onUpdateEmail">
          Update email
        </Button>
      </div>
    </div>

    <div data-test="address-element">
      <Label class="mb-2 block">Billing address</Label>
      <VueStripeAddressElement :options="{ mode: 'billing' }" />
    </div>

    <div v-if="props.taxId" data-test="tax-id-element">
      <Label class="mb-2 block">Tax ID</Label>
      <VueStripeTaxIdElement />
    </div>

    <div data-test="payment-element">
      <Label class="mb-2 block">Payment</Label>
      <VueStripePaymentElement />
    </div>

    <div v-if="props.linkSignup" data-test="link-signup-element">
      <Label class="mb-2 block">Link signup</Label>
      <VueStripeLinkSignupElement
        @ready="emit('log', 'linkSignup ready')"
        @loaderror="onLoadError"
      />
    </div>

    <div>
      <Label for="cs-promo" class="mb-2 block">Promotion code</Label>
      <div class="flex gap-2">
        <Input id="cs-promo" v-model="promo" placeholder="PROMO CODE" class="flex-1" />
        <Button variant="outline" @click="onApplyPromo">Apply</Button>
      </div>
    </div>

    <div v-if="props.terms" data-test="terms-element">
      <VueStripeTermsElement @ready="emit('log', 'terms ready')" @loaderror="onLoadError" />
    </div>

    <Button
      size="lg"
      data-test="confirm"
      :disabled="loading || confirming || !canConfirm"
      @click="onConfirm"
    >
      {{ confirming ? 'Processing...' : `Pay ${total}` }}
    </Button>

    <p v-if="result" class="rounded-md bg-muted p-3 text-sm" data-test="result">{{ result }}</p>
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
  </div>
</template>
