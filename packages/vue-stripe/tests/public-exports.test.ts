import { describe, it, expect } from 'vitest'
import * as VueStripe from '../src'
import type {
  UseStripeCheckoutReturn,
  CheckoutRedirectOptions,
  LegacyCheckoutOptions,
  ConfirmPaymentOptions,
  ConfirmSetupOptions
} from '../src'

describe('public API exports', () => {
  it('exports the plugin, loader and error classes', () => {
    expect(typeof VueStripe.createVueStripe).toBe('function')
    expect(typeof VueStripe.loadStripe).toBe('function')
    expect(typeof VueStripe.VueStripeProviderError).toBe('function')
    expect(typeof VueStripe.VueStripeElementsError).toBe('function')
    expect(typeof VueStripe.VueStripeCheckoutError).toBe('function')
  })

  it('exports composables (incl. aliases)', () => {
    expect(typeof VueStripe.useStripe).toBe('function')
    expect(typeof VueStripe.useStripeCheckout).toBe('function')
    expect(typeof VueStripe.useCheckout).toBe('function')
    expect(typeof VueStripe.useStripeElements).toBe('function')
    expect(typeof VueStripe.useElements).toBe('function')
    expect(typeof VueStripe.useCheckoutSession).toBe('function')
  })

  it('exports the Custom Checkout provider component', () => {
    expect(VueStripe.VueStripeCheckoutProvider).toBeTruthy()
  })

  it('exports the checkout + confirm option types (compile-time check)', () => {
    // Type-only usage — fails `vue-tsc` if any of these are not exported (#384a).
    const redirect: CheckoutRedirectOptions = { url: 'https://example.com' }
    const legacy: LegacyCheckoutOptions = { sessionId: 'cs_test_123' }
    const confirmPayment: ConfirmPaymentOptions = { clientSecret: 'pi_secret' }
    const confirmSetup: ConfirmSetupOptions = { clientSecret: 'seti_secret' }
    const checkoutReturn: UseStripeCheckoutReturn | null = null

    expect([redirect, legacy, confirmPayment, confirmSetup, checkoutReturn]).toHaveLength(5)
  })
})
