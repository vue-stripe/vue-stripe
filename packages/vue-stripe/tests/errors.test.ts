import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue-demi'
import * as lib from '../src'
import { VueStripeProviderError, VueStripeElementsError, VueStripeCheckoutError } from '../src'

describe('typed error classes', () => {
  it.each([
    [VueStripeProviderError, 'VueStripeProviderError'],
    [VueStripeElementsError, 'VueStripeElementsError'],
    [VueStripeCheckoutError, 'VueStripeCheckoutError']
  ])('%o has name %s, a message and is an Error', (Ctor, name) => {
    const error = new Ctor('boom')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(Ctor)
    expect(error.name).toBe(name)
    expect(error.message).toBe('boom')
  })

  it('no longer exports the unused VueStripeLoadError / createVueStripeError (#380)', async () => {
    const mod = (await import('../src')) as Record<string, unknown>
    expect(mod['VueStripeLoadError']).toBeUndefined()
    expect(mod['createVueStripeError']).toBeUndefined()
  })
})

describe('missing Stripe context (#580)', () => {
  const PLUGIN_HINT = 'within a VueStripeProvider component or an app using createVueStripe()'
  const consumers: [string, () => void][] = [
    ['useStripe', () => lib.useStripe()],
    ['usePaymentIntent', () => lib.usePaymentIntent()],
    ['useSetupIntent', () => lib.useSetupIntent()],
    ['useCreatePaymentMethod', () => lib.useCreatePaymentMethod()],
    ['useHandleNextAction', () => lib.useHandleNextAction()],
    ['useFinancialConnections', () => lib.useFinancialConnections()],
    ['useIdentity', () => lib.useIdentity()],
    ['usePaymentRequest', () => lib.usePaymentRequest({} as never)],
    ['useConfirmCardPayment', () => lib.useConfirmCardPayment()],
    ['useEphemeralKeyNonce', () => lib.useEphemeralKeyNonce()],
    ['useRadarSession', () => lib.useRadarSession()],
    ['useCreateConfirmationToken', () => lib.useCreateConfirmationToken()],
    ['VueStripeElements', () => h(lib.VueStripeElements as never)],
    ['VueStripeEmbeddedCheckout', () => h(lib.VueStripeEmbeddedCheckout as never)],
    ['VueStripeCheckoutElementsProvider', () => h(lib.VueStripeCheckoutElementsProvider as never)],
    ['VueStripeCheckoutFormProvider', () => h(lib.VueStripeCheckoutFormProvider as never)]
  ]

  it.each(consumers)(
    '%s names both ways to provide Stripe, with no Vue warning first',
    (name, use) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const isComponent = !name.startsWith('use')
      const Host = defineComponent({
        setup() {
          if (isComponent) return () => use() as never
          use()
          return () => null
        }
      })
      expect(() => mount(Host)).toThrow(
        `${name} must be ${isComponent ? 'used' : 'called'} ${PLUGIN_HINT}`
      )
      expect(warn.mock.calls.flat().join(' ')).not.toMatch(/injection .* not found/)
      warn.mockRestore()
    }
  )

  it('useStripeElements throws its typed error with no Vue warning first', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Host = defineComponent({
      setup() {
        lib.useStripeElements()
        return () => null
      }
    })
    expect(() => mount(Host)).toThrow(lib.VueStripeElementsError)
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/injection .* not found/)
    warn.mockRestore()
  })
})
