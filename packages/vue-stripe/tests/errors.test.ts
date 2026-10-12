import { describe, it, expect } from 'vitest'
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
