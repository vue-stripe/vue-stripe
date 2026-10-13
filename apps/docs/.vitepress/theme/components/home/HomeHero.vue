<script setup lang="ts">
// Home page hero. The default slot carries a highlighted code fence from index.md
// (markdown inside the slot), shown in the code card; the payment sheet next to it is a
// static preview of what that template renders.
import { withBase } from 'vitepress'
import StripeBadge from '../StripeBadge.vue'
import GitHubStarsCTA from '../GitHubStarsCTA.vue'
</script>

<template>
  <div class="hero-wrap">
    <section class="hero">
      <div class="hero-copy">
        <div class="hero-badge">
          <StripeBadge />
        </div>

        <h1 class="hero-title">
          <span class="hero-name">Vue Stripe</span>
          Stripe Elements and Checkout as Vue components
        </h1>
        <p class="hero-lede">
          Components and composables for every Stripe.js element and method, typed and tested on Vue
          3 and Vue 2.7.
        </p>

        <div class="hero-actions">
          <a class="hero-btn is-brand" :href="withBase('/guide/first-payment')">Get started</a>
          <a class="hero-btn is-alt" :href="withBase('/live-demo/')">Try the live demos</a>
          <GitHubStarsCTA />
        </div>

        <a class="hero-notice" :href="withBase('/guide/migration-v6')">
          <span class="hero-notice-dot" aria-hidden="true" />
          <span>Now on Stripe.js 10 (Endive)</span>
          <span class="hero-notice-link">What changed in v6</span>
        </a>
      </div>

      <div class="hero-visual" aria-label="Example: a Vue template and the payment form it renders">
        <div class="hero-code">
          <div class="hero-code-bar">
            <span>CheckoutPage.vue</span>
          </div>
          <slot />
        </div>

        <div class="hero-sheet" aria-hidden="true">
          <div class="sheet-tabs">
            <span class="sheet-tab is-active">Card</span>
            <span class="sheet-tab">Bank</span>
            <span class="sheet-tab">Link</span>
          </div>
          <div class="sheet-field">
            <span class="sheet-label">Card number</span>
            <span class="sheet-input"
              >4242 4242 4242 4242 <span class="sheet-brand">VISA</span></span
            >
          </div>
          <div class="sheet-row">
            <div class="sheet-field">
              <span class="sheet-label">Expiration</span>
              <span class="sheet-input">12 / 34</span>
            </div>
            <div class="sheet-field">
              <span class="sheet-label">CVC</span>
              <span class="sheet-input">123</span>
            </div>
          </div>
          <div class="sheet-field">
            <span class="sheet-label">Country</span>
            <span class="sheet-input">United States</span>
          </div>
          <span class="sheet-pay">Pay $25.00</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Full width, so the showcase glow is only ever cut at the viewport edge */
.hero-wrap {
  overflow-x: clip;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 48px;
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

@media (min-width: 960px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 56px;
    align-items: center;
    padding: 72px 32px 88px;
  }
}

.hero-badge {
  margin-bottom: 24px;
}

.hero-badge :deep(.stripe-badge-link) {
  margin-bottom: 0;
}

/* Endive notice: small, quiet, one line, under the actions */
.hero-notice {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
  padding: 4px 12px 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.6;
  text-decoration: none;
  transition: border-color 0.15s;
}

.hero-notice:hover {
  border-color: var(--vp-c-brand-1);
}

.hero-notice-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--vp-c-green-1);
  box-shadow: 0 0 0 3px var(--vp-c-green-soft);
}

.hero-notice-link {
  color: var(--vp-c-brand-1);
}

.hero-title {
  margin: 0;
  font-size: clamp(32px, 5.2vw, 52px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
  max-width: 15ch;
}

.hero-name {
  display: block;
  margin-bottom: 6px;
  color: var(--vp-c-brand-1);
}

.hero-lede {
  max-width: 46ch;
  margin: 20px 0 0;
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  border-radius: 22px;
  border: 1px solid transparent;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 0.15s,
    border-color 0.15s;
}

.hero-btn.is-brand {
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

.hero-btn.is-brand:hover {
  background: var(--vp-button-brand-hover-bg);
  color: var(--vp-button-brand-hover-text);
}

.hero-btn.is-alt {
  border-color: var(--vp-c-border);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.hero-btn.is-alt:hover {
  border-color: var(--vp-c-brand-1);
}

.hero-actions :deep(.github-stars-wrapper) {
  margin: 0;
  padding: 0;
}

.hero-actions :deep(.github-stars-cta) {
  height: 44px;
  padding: 0 18px;
  font-size: 15px;
}

.hero-btn:focus-visible,
.hero-notice:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}

/* Visual: the code card, and the payment sheet it renders overlapping its lower right corner */
.hero-visual {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
}

/* Brand glow behind the showcase: Vue Stripe yellow above, Stripe blurple below */
.hero-visual::before,
.hero-visual::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  pointer-events: none;
}

.hero-visual::before {
  top: -8%;
  left: 18%;
  width: 220px;
  height: 220px;
  background: #fed968;
  filter: blur(80px);
  opacity: 0.75;
}

.hero-visual::after {
  right: 4%;
  bottom: -14%;
  width: 360px;
  height: 360px;
  background: #635bff;
  filter: blur(110px);
  opacity: 0.6;
}

.dark .hero-visual::before {
  opacity: 0.5;
}

.dark .hero-visual::after {
  opacity: 0.5;
}

.hero-code {
  width: min(100%, 520px);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-code-block-bg);
  overflow: hidden;
}

.hero-code-bar {
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}

.hero-code :deep(div[class*='language-']) {
  margin: 0 !important;
  border-radius: 0 !important;
  background: transparent;
}

.hero-code :deep(pre) {
  padding: 16px 20px 18px !important;
}

.hero-code :deep(code) {
  font-size: 13px;
  line-height: 1.7;
}

.hero-code :deep(.lang),
.hero-code :deep(button.copy) {
  display: none;
}

.hero-sheet {
  position: relative;
  align-self: flex-end;
  width: min(290px, 82%);
  margin-top: -56px;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: #fff;
  color: #30313d;
  box-shadow: 0 18px 40px -16px rgba(50, 50, 93, 0.35);
  font-size: 12px;
}

.sheet-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.sheet-tab {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  color: #6d6e78;
  font-weight: 500;
}

.sheet-tab.is-active {
  border-color: #635bff;
  color: #635bff;
  box-shadow: 0 0 0 1px #635bff;
}

.sheet-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.sheet-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sheet-label {
  color: #30313d;
  font-weight: 500;
}

.sheet-input {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  color: #30313d;
}

.sheet-brand {
  color: #1a1f71;
  font-weight: 800;
  font-style: italic;
  font-size: 11px;
}

.sheet-pay {
  display: block;
  margin-top: 4px;
  padding: 9px;
  border-radius: 6px;
  background: #635bff;
  color: #fff;
  font-weight: 600;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .hero-btn,
  .hero-notice {
    transition: none;
  }
}
</style>
