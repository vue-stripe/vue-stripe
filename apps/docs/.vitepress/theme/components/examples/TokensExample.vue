<script setup lang="ts">
import { VueStripeProvider, VueStripeElements } from '@vue-stripe/vue-stripe'
import ConfirmationTokenPanel from './ConfirmationTokenPanel.vue'
import CardTokenPanel from './CardTokenPanel.vue'
import RadarSessionPanel from './RadarSessionPanel.vue'
import { useStripeConfig } from '../../composables/useStripeConfig'
import DocIcon from '../DocIcon.vue'

const { publishableKey } = useStripeConfig()
</script>

<template>
  <div class="tokens-example">
    <div v-if="!publishableKey" class="warning-box">
      <strong><DocIcon name="warning" /> Missing Configuration</strong>
      <p>Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
    </div>

    <VueStripeProvider v-else :publishable-key="publishableKey">
      <section class="demo-section">
        <h3>ConfirmationToken <span class="tag">useCreateConfirmationToken</span></h3>
        <p class="intro">
          The Payment Element runs without an Intent (<code>mode</code>, <code>amount</code> and
          <code>currency</code> on <code>VueStripeElements</code>). The token carries what the
          customer entered; your server creates and confirms the PaymentIntent with it.
        </p>
        <VueStripeElements mode="payment" :amount="1099" currency="usd">
          <ConfirmationTokenPanel />
        </VueStripeElements>
      </section>

      <section class="demo-section">
        <h3>Card Token (legacy) <span class="tag">useCreateToken</span></h3>
        <p class="intro">
          A single-use Token from the Card Element, for Charges or Connect integrations. New
          integrations use a PaymentMethod or a ConfirmationToken instead.
        </p>
        <VueStripeElements>
          <CardTokenPanel />
        </VueStripeElements>
      </section>

      <section class="demo-section">
        <h3>Radar Session <span class="tag">useRadarSession</span></h3>
        <p class="intro">
          Device signals for Radar when you collect payment details outside Stripe.js. Pass the ID
          as <code>radar_options.session</code> on your server.
        </p>
        <RadarSessionPanel />
      </section>
    </VueStripeProvider>
  </div>
</template>

<style scoped>
.tokens-example {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}
.warning-box {
  padding: 1rem;
  background: var(--vp-c-yellow-soft);
  border: 1px solid var(--vp-c-yellow-1);
  border-radius: 8px;
  color: var(--vp-c-yellow-darker);
}
.warning-box strong {
  display: block;
  margin-bottom: 0.5rem;
}
.warning-box p {
  margin: 0;
  font-size: 0.875rem;
}
.demo-section {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}
.demo-section + .demo-section {
  margin-top: 1.5rem;
}
.demo-section h3 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
.tag {
  padding: 0.125rem 0.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
}
.intro {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}
.intro code {
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-bg);
  border-radius: 3px;
  font-size: 0.85em;
}
</style>
