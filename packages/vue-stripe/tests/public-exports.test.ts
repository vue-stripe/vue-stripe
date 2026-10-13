import { describe, it, expect, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as VueStripe from '../src'
import { STRIPE_CONFIRMERS, composableName } from './stripe-confirmers'
import type {
  UseStripeCheckoutReturn,
  CheckoutRedirectOptions,
  ConfirmPaymentOptions,
  ConfirmSetupOptions,
  UseStripeMethodReturn,
  CollectFinancialConnectionsAccountsOptions,
  CollectBankAccountTokenOptions,
  CollectBankAccountForPaymentResult,
  UseFinancialConnectionsReturn,
  UseIdentityReturn,
  VerifyIdentityResult,
  ReleaseTrain,
  CreateConfirmationTokenOptions,
  UseCreateConfirmationTokenReturn,
  UsePaymentRequestReturn,
  PaymentRequestEventHandler,
  PaymentRequestOptions,
  CanMakePaymentResult
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
    expect(typeof VueStripe.useFinancialConnections).toBe('function')
    expect(typeof VueStripe.useIdentity).toBe('function')
    expect(typeof VueStripe.usePaymentRequest).toBe('function')
  })

  it('exports the token and other Stripe method composables', () => {
    const names = [
      'useCreateToken',
      'useCreateConfirmationToken',
      'useHandleCardAction',
      'useVerifyMicrodepositsForPayment',
      'useVerifyMicrodepositsForSetup',
      'useRadarSession',
      'useEphemeralKeyNonce'
    ]
    for (const name of names) {
      expect(typeof (VueStripe as Record<string, unknown>)[name], name).toBe('function')
    }
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

  it('exports the Checkout Form SDK provider, form component and composable', () => {
    expect(VueStripe.VueStripeCheckoutFormProvider).toBeTruthy()
    expect(VueStripe.VueStripeCheckoutForm).toBeTruthy()
    expect(typeof VueStripe.useCheckoutForm).toBe('function')
  })

  it('exports the six Issuing elements', () => {
    const issuing = [
      'VueStripeIssuingCardNumberDisplayElement',
      'VueStripeIssuingCardCvcDisplayElement',
      'VueStripeIssuingCardExpiryDisplayElement',
      'VueStripeIssuingCardPinDisplayElement',
      'VueStripeIssuingCardCopyButtonElement',
      'VueStripeIssuingAddToWalletButtonElement'
    ]
    for (const name of issuing) {
      expect((VueStripe as Record<string, unknown>)[name], name).toBeTruthy()
    }
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
    const tokenOptions: CreateConfirmationTokenOptions = { skipSubmit: true }
    const tokenReturn: UseCreateConfirmationTokenReturn | null = null

    expect([
      redirect,
      confirmPayment,
      confirmSetup,
      checkoutReturn,
      methodReturn,
      tokenOptions,
      tokenReturn
    ]).toHaveLength(7)
  })

  it('exports the Financial Connections and Identity types (compile-time check)', () => {
    // Type-only usage: fails `vue-tsc` if any of these are not exported.
    const accounts: CollectFinancialConnectionsAccountsOptions = {
      clientSecret: 'fcsess_secret',
      preCollectedConsent: { consent: 'fcconsent_123', collectedAt: 1760000000 }
    }
    const token: CollectBankAccountTokenOptions = { clientSecret: 'fcsess_secret' }
    const notLoaded: CollectBankAccountForPaymentResult = {
      error: { message: 'Stripe not initialized' }
    }
    const identity: VerifyIdentityResult = { error: { message: 'Stripe not initialized' } }
    const returns: [UseFinancialConnectionsReturn | null, UseIdentityReturn | null] = [null, null]

    expect([accounts, token, notLoaded, identity, returns]).toHaveLength(5)
  })

  it('re-exports the ReleaseTrain type of the installed @stripe/stripe-js (compile-time check)', () => {
    // @stripe/stripe-js 10 loads https://js.stripe.com/endive/stripe.js.
    const train: ReleaseTrain = 'endive'
    expect(train).toBe('endive')
  })

  it('re-exports a pure-entry loadStripe that keeps setLoadParameters', async () => {
    const pure = vi.mocked(await import('@stripe/stripe-js/pure')).loadStripe
    await VueStripe.loadStripe('pk_test_123', { locale: 'fr' })
    expect(pure).toHaveBeenCalledWith('pk_test_123', { locale: 'fr' })

    VueStripe.loadStripe.setLoadParameters({ advancedFraudSignals: false })
    expect(pure.setLoadParameters).toHaveBeenCalledWith({ advancedFraudSignals: false })
  })

  it('exports the Payment Request types (compile-time check)', () => {
    // Type-only usage: fails `vue-tsc` if any of these are not exported.
    const options: PaymentRequestOptions = {
      country: 'US',
      currency: 'usd',
      total: { label: 'Total', amount: 1099 }
    }
    const onPaymentMethod: PaymentRequestEventHandler<'paymentmethod'> = (event) =>
      event.complete('success')
    const wallets: CanMakePaymentResult = { applePay: false, googlePay: true }
    const returns: UsePaymentRequestReturn | null = null

    expect([options, onPaymentMethod, wallets, returns]).toHaveLength(4)
  })
})

// Apps should never need '@stripe/stripe-js' for a type that a component or composable puts
// in its public signature (options, element instances, event payloads, results).
describe('Stripe.js types used by the library are re-exported', () => {
  const src = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
  const files = (dir: string): string[] =>
    readdirSync(resolve(src, dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(`${dir}/${entry.name}`)
        : entry.name.endsWith('.ts')
          ? [`${dir}/${entry.name}`]
          : []
    )
  const used = new Set<string>()
  for (const file of [...files('components'), ...files('composables'), ...files('utils')]) {
    const code = readFileSync(resolve(src, file), 'utf8')
    for (const match of code.matchAll(
      /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'@stripe\/stripe-js(?:\/pure)?'/g
    )) {
      for (const raw of (match[1] as string).split(',')) {
        const name =
          raw
            .replace(/^\s*type\s+/, '')
            .split(/\s+as\s+/)[0]
            ?.trim() ?? ''
        if (/^[A-Z]/.test(name)) used.add(name)
      }
    }
  }
  const index = readFileSync(resolve(src, 'index.ts'), 'utf8')

  it('finds the Stripe.js types the sources use', () => {
    expect(used.size).toBeGreaterThan(50)
  })

  it.each([...used].sort())('%s is exported from src/index.ts', (name) => {
    expect(index).toMatch(new RegExp(`\\b${name}\\b`))
  })
})
