import { describe, it, expect } from 'vitest'
import * as VueStripe from '../src'
import { coverage } from '../../../apps/docs/.vitepress/theme/data/stripe-coverage'
import { STRIPE_CONFIRMERS, composableName } from './stripe-confirmers'

/**
 * Guards the home-page Stripe.js coverage tracker
 * (apps/docs/.vitepress/theme/data/stripe-coverage.ts) against drift: anything
 * marked `covered` must name a real export of @vue-stripe/vue-stripe, so the
 * headline number can never claim more than actually ships.
 */
describe('docs coverage matrix', () => {
  const exportNames = new Set(Object.keys(VueStripe))
  const items = coverage.flatMap((c) => c.items)

  it('every "covered" entry names a real package export', () => {
    for (const item of items.filter((i) => i.status === 'covered')) {
      expect(item.artifact, `"${item.name}" is covered but has no artifact`).toBeTruthy()
      expect(
        exportNames.has(item.artifact!),
        `"${item.name}" claims export "${item.artifact}" which is not exported from @vue-stripe/vue-stripe`
      ).toBe(true)
    }
  })

  it('planned entries link a roadmap issue; only covered entries carry an artifact', () => {
    for (const item of items) {
      if (item.status === 'planned') {
        expect(typeof item.issue, `"${item.name}" is planned but has no issue number`).toBe(
          'number'
        )
      }
      if (item.status !== 'covered') {
        expect(
          item.artifact,
          `"${item.name}" is ${item.status} but names an artifact`
        ).toBeUndefined()
      }
    }
  })
})

describe('docs coverage matrix reflects Stripe.js 10 (Endive)', () => {
  const items = coverage.flatMap((c) => c.items)
  const byApi = (needle: string) => items.filter((i) => i.api.includes(needle))

  it('APIs removed from Stripe.js are only listed as deprecated', () => {
    const removed = [
      "'paymentRequestButton'",
      "'affirmMessage'",
      "'afterpayClearpayMessage'",
      "'idealBank'",
      'stripe.redirectToCheckout',
      'initCheckout()',
      'initEmbeddedCheckout'
    ]
    for (const needle of removed) {
      for (const item of byApi(needle)) {
        expect(item.status, `"${item.name}" (${item.api}) was removed from Stripe.js`).toBe(
          'deprecated'
        )
      }
    }
  })

  it('uses the Stripe.js 10 names for the Checkout APIs', () => {
    expect(byApi('stripe.initCheckoutElementsSdk()')[0]).toMatchObject({
      status: 'covered',
      artifact: 'VueStripeCheckoutElementsProvider'
    })
    expect(byApi('stripe.createEmbeddedCheckoutPage()')[0]).toMatchObject({
      status: 'covered',
      artifact: 'VueStripeEmbeddedCheckout'
    })
    expect(byApi('stripe.initCheckoutFormSdk()')[0]).toMatchObject({
      status: 'covered',
      artifact: 'VueStripeCheckoutFormProvider'
    })
    expect(byApi('checkoutFormSdk.createForm()')[0]).toMatchObject({
      status: 'covered',
      artifact: 'VueStripeCheckoutForm'
    })
  })

  it('lists the APIs that survive in 10.x and the newly wrapped ones', () => {
    expect(byApi('stripe.paymentRequest()')[0]?.status).toBe('accessible')
    expect(byApi('elements.fetchUpdates()')[0]).toMatchObject({
      status: 'covered',
      artifact: 'useStripeElements'
    })
    expect(byApi('elements.getElement()')[0]).toMatchObject({
      status: 'covered',
      artifact: 'useStripeElements'
    })
    expect(byApi("elements.on('update-end')")[0]).toMatchObject({
      status: 'covered',
      artifact: 'VueStripeElements'
    })
    const checkoutSessionElements = {
      "'contactDetails'": 'VueStripeContactDetailsElement',
      "'terms'": 'VueStripeTermsElement',
      "'linkSignup'": 'VueStripeLinkSignupElement'
    }
    for (const [element, artifact] of Object.entries(checkoutSessionElements)) {
      expect(byApi(element)[0], element).toMatchObject({ status: 'covered', artifact })
    }
    for (const name of ['FinancialAccount', 'Issuing', 'Treasury']) {
      expect(byApi(`stripe.create${name}Disclosure()`)[0], name).toMatchObject({
        status: 'covered',
        artifact: `VueStripe${name}Disclosure`
      })
    }
  })

  it('marks the six Issuing elements covered by their components', () => {
    const issuing: Array<[string, string]> = [
      ['issuingCardNumberDisplay', 'VueStripeIssuingCardNumberDisplayElement'],
      ['issuingCardCvcDisplay', 'VueStripeIssuingCardCvcDisplayElement'],
      ['issuingCardExpiryDisplay', 'VueStripeIssuingCardExpiryDisplayElement'],
      ['issuingCardPinDisplay', 'VueStripeIssuingCardPinDisplayElement'],
      ['issuingCardCopyButton', 'VueStripeIssuingCardCopyButtonElement'],
      ['issuingAddToWalletButton', 'VueStripeIssuingAddToWalletButtonElement']
    ]
    for (const [type, artifact] of issuing) {
      expect(byApi(`'${type}'`)[0], type).toMatchObject({ status: 'covered', artifact })
    }
  })

  it('lists every method-specific confirmer as covered by its own composable', () => {
    for (const method of STRIPE_CONFIRMERS) {
      expect(byApi(`stripe.${method}()`), method).toEqual([
        expect.objectContaining({ status: 'covered', artifact: composableName(method) })
      ])
    }
    expect(byApi('stripe.confirm<Method>Payment/Setup()')).toEqual([])
  })

  it('covers every loadStripe() option, the load parameters and the release train', () => {
    for (const needle of ['developerTools', 'setLoadParameters', 'ReleaseTrain']) {
      expect(byApi(needle)[0], needle).toMatchObject({
        status: 'covered',
        artifact: 'VueStripeProvider'
      })
    }
  })

  it('lists the token and other Stripe method composables as covered', () => {
    const wrapped = {
      'stripe.createToken()': 'useCreateToken',
      'stripe.createConfirmationToken()': 'useCreateConfirmationToken',
      'stripe.handleCardAction()': 'useHandleCardAction',
      'stripe.verifyMicrodepositsForPayment()': 'useVerifyMicrodepositsForPayment',
      'stripe.verifyMicrodepositsForSetup()': 'useVerifyMicrodepositsForSetup',
      'stripe.createRadarSession()': 'useRadarSession',
      'stripe.createEphemeralKeyNonce()': 'useEphemeralKeyNonce'
    }
    for (const [api, artifact] of Object.entries(wrapped)) {
      expect(byApi(api), api).toEqual([expect.objectContaining({ status: 'covered', artifact })])
    }
  })

  it('planned rows point at open v6 milestone issues', () => {
    const v6Issues = new Set([473, 492, 493, 494, 495, 496, 497, 503, 504, 505, 506, 507, 508])
    for (const item of items.filter((i) => i.status === 'planned')) {
      expect(v6Issues.has(item.issue!), `"${item.name}" points at #${item.issue}`).toBe(true)
    }
  })
})
