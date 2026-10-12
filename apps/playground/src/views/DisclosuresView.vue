<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import {
  VueStripeProvider,
  VueStripeFinancialAccountDisclosure,
  VueStripeIssuingDisclosure,
  VueStripeTreasuryDisclosure,
  type DisclosureError
} from '@vue-stripe/vue-stripe'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Input,
  Label
} from '@/components/ui'

const stripeConfig = inject<{ publishableKey: string }>('stripeConfig')
const publishableKey = computed(() => stripeConfig?.publishableKey || '')

const businessName = ref('')
const learnMoreLink = ref('')
const issuingProgramID = ref('')

// Each disclosure reports `load` or `error`; Stripe returns an error when the account
// has not onboarded to Treasury / Issuing.
const status = ref<Record<string, string>>({})
const onLoad = (name: string) => (status.value[name] = 'load')
const onError = (name: string, error: DisclosureError) =>
  (status.value[name] = `error: ${error.message}`)

// Empty inputs are left out, so Stripe falls back to its defaults.
const value = (input: string) => input.trim() || undefined
</script>

<template>
  <div class="max-w-[900px] mx-auto flex flex-col gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Disclosures</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">
          <code>VueStripeFinancialAccountDisclosure</code>,
          <code>VueStripeIssuingDisclosure</code> and <code>VueStripeTreasuryDisclosure</code> port
          React Stripe.js 7's disclosure components. Each calls a Stripe.js method
          (<code>stripe.createFinancialAccountDisclosure()</code>, ...) and mounts the legal text it
          returns. Stripe answers with an error unless the account has onboarded to Treasury
          (Financial Accounts) or Issuing.
        </p>
      </CardContent>
    </Card>

    <Alert v-if="!publishableKey" variant="warning">
      <AlertDescription>
        No Stripe key configured. Click <strong>"Add Key"</strong> in the header above.
      </AlertDescription>
    </Alert>

    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Options</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <Label for="d-business">businessName</Label>
            <Input id="d-business" v-model="businessName" placeholder="(from the account)" />
          </div>
          <div class="space-y-2">
            <Label for="d-link">learnMoreLink</Label>
            <Input id="d-link" v-model="learnMoreLink" placeholder="https://..." />
          </div>
          <div class="space-y-2">
            <Label for="d-program">issuingProgramID</Label>
            <Input id="d-program" v-model="issuingProgramID" placeholder="iprg_..." />
          </div>
        </CardContent>
      </Card>

      <VueStripeProvider :publishable-key="publishableKey">
        <div class="flex flex-col gap-6">
          <Card data-test="financial-account-disclosure">
            <CardHeader>
              <CardTitle class="text-lg">VueStripeFinancialAccountDisclosure</CardTitle>
            </CardHeader>
            <CardContent>
              <VueStripeFinancialAccountDisclosure
                :options="{
                  businessName: value(businessName),
                  learnMoreLink: value(learnMoreLink)
                }"
                @load="onLoad('financialAccount')"
                @error="(e) => onError('financialAccount', e)"
              />
              <p class="text-xs text-muted-foreground mt-2" data-test="status">
                {{ status['financialAccount'] ?? 'pending' }}
              </p>
            </CardContent>
          </Card>

          <Card data-test="issuing-disclosure">
            <CardHeader>
              <CardTitle class="text-lg">VueStripeIssuingDisclosure</CardTitle>
            </CardHeader>
            <CardContent>
              <VueStripeIssuingDisclosure
                :options="{
                  issuingProgramID: value(issuingProgramID),
                  learnMoreLink: value(learnMoreLink)
                }"
                @load="onLoad('issuing')"
                @error="(e) => onError('issuing', e)"
              />
              <p class="text-xs text-muted-foreground mt-2" data-test="status">
                {{ status['issuing'] ?? 'pending' }}
              </p>
            </CardContent>
          </Card>

          <Card data-test="treasury-disclosure">
            <CardHeader>
              <CardTitle class="text-lg">VueStripeTreasuryDisclosure</CardTitle>
            </CardHeader>
            <CardContent>
              <VueStripeTreasuryDisclosure
                :options="{
                  businessName: value(businessName),
                  learnMoreLink: value(learnMoreLink)
                }"
                @load="onLoad('treasury')"
                @error="(e) => onError('treasury', e)"
              />
              <p class="text-xs text-muted-foreground mt-2" data-test="status">
                {{ status['treasury'] ?? 'pending' }}
              </p>
            </CardContent>
          </Card>
        </div>
      </VueStripeProvider>
    </template>
  </div>
</template>
