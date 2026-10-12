import { describe, it, expect } from 'vitest'
import * as VueStripe from '../src'
import { STRIPE_CONFIRMERS, composableName } from './stripe-confirmers'
import type {
  UseStripeCheckoutReturn,
  CheckoutRedirectOptions,
  ConfirmPaymentOptions,
  ConfirmSetupOptions,
  UseStripeMethodReturn
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

  it('exports a useConfirm<Method> composable for every Stripe.js confirmer', () => {
    for (const method of STRIPE_CONFIRMERS) {
      const name = composableName(method)
      expect(typeof (VueStripe as Record<string, unknown>)[name], name).toBe('function')
    }
  })

  it('exports the Checkout Elements provider under its canonical name and the v5 alias', () => {
    expect(VueStripe.VueStripeCheckoutElementsProvider).toBeTruthy()
    expect(VueStripe.VueStripeCheckoutProvider).toBe(VueStripe.VueStripeCheckoutElementsProvider)
  })

  it('exports VueStripeEmbeddedCheckout', () => {
    expect(VueStripe.VueStripeEmbeddedCheckout).toBeTruthy()
  })

  it('does not export elements removed in Stripe.js 8+ (Clover)', () => {
    const removed = [
      'VueStripeIdealBankElement',
      'VueStripeP24BankElement',
      'VueStripeEpsBankElement',
      'VueStripeFpxBankElement'
    ]
    for (const name of removed) {
      expect((VueStripe as Record<string, unknown>)[name]).toBeUndefined()
    }
  })

  it('exports the checkout + confirm option types (compile-time check)', () => {
    // Type-only usage — fails `vue-tsc` if any of these are not exported (#384a).
    const redirect: CheckoutRedirectOptions = { url: 'https://example.com' }
    const confirmPayment: ConfirmPaymentOptions = { clientSecret: 'pi_secret' }
    const confirmSetup: ConfirmSetupOptions = { clientSecret: 'seti_secret' }
    const checkoutReturn: UseStripeCheckoutReturn | null = null
    const methodReturn: UseStripeMethodReturn<'confirmCardPayment'> | null = null

    expect([redirect, confirmPayment, confirmSetup, checkoutReturn, methodReturn]).toHaveLength(5)
  })
})
