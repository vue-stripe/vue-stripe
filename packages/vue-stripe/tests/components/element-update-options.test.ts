import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, provide, ref, shallowRef } from 'vue-demi'
import VueStripeAddressElement from '../../src/components/VueStripeAddressElement'
import VueStripeCardElement from '../../src/components/VueStripeCardElement'
import VueStripeCardNumberElement from '../../src/components/VueStripeCardNumberElement'
import VueStripeExpressCheckoutElement from '../../src/components/VueStripeExpressCheckoutElement'
import VueStripePaymentElement from '../../src/components/VueStripePaymentElement'
import { stripeElementsInjectionKey } from '../../src/utils/injection-keys'
import { flushPromises, makeMockElement, makeMockElements } from '../setup'

// Stripe.js 10 accepts only its `*UpdateOptions` keys in element.update() and warns
// ("Unrecognized ... update() parameter") for create-only keys (#616).
const cases = [
  {
    name: 'VueStripeExpressCheckoutElement',
    component: VueStripeExpressCheckoutElement,
    createOnly: {
      applePay: { recurringPaymentRequest: undefined },
      business: { name: 'Shop' },
      buttonTheme: { applePay: 'black' },
      buttonType: { applePay: 'buy', googlePay: 'buy' },
      lineItems: [{ name: 'T', amount: 100 }],
      paymentMethods: { link: 'auto' },
      shippingRates: [{ id: 'free', amount: 0, displayName: 'Free' }],
      wallets: { applePay: 'always' }
    },
    updatable: { buttonHeight: 55, layout: { maxColumns: 3, maxRows: 1 } }
  },
  {
    name: 'VueStripePaymentElement',
    component: VueStripePaymentElement,
    createOnly: { wallets: { applePay: 'never' } },
    updatable: { layout: 'accordion', readOnly: true }
  },
  {
    name: 'VueStripeCardElement',
    component: VueStripeCardElement,
    createOnly: { disableLink: true, preferredNetwork: ['cartes_bancaires'] },
    updatable: { hidePostalCode: true }
  },
  {
    name: 'VueStripeCardNumberElement',
    component: VueStripeCardNumberElement,
    createOnly: { disableLink: true, preferredNetwork: ['cartes_bancaires'] },
    updatable: { showIcon: true }
  },
  {
    name: 'VueStripeAddressElement',
    component: VueStripeAddressElement,
    createOnly: { mode: 'billing' },
    updatable: { display: { name: 'split' } }
  }
]

describe('element.update() receives only the options Stripe can update (#616)', () => {
  for (const { name, component, createOnly, updatable } of cases) {
    it(`${name}: keeps create-only keys out of update()`, async () => {
      const element = makeMockElement()
      const elements = makeMockElements()
      elements.create.mockImplementation(() => element)
      const options = ref<Record<string, unknown>>({ ...createOnly })
      mount(
        defineComponent({
          setup() {
            provide(stripeElementsInjectionKey, {
              elements: shallowRef(elements as never),
              loading: ref(false),
              error: ref(null)
            })
            return () => h(component as never, { options: options.value })
          }
        })
      )
      await flushPromises()
      expect(elements.create.mock.calls[0]![1]).toMatchObject(createOnly)

      // Only a create-only key changes: nothing to update.
      options.value = { ...createOnly, [Object.keys(createOnly)[0]!]: 'changed' }
      await flushPromises()
      expect(element.update).not.toHaveBeenCalled()

      options.value = { ...createOnly, ...updatable }
      await flushPromises()
      expect(element.update).toHaveBeenCalledTimes(1)
      expect(element.update).toHaveBeenCalledWith(updatable)
    })
  }
})
