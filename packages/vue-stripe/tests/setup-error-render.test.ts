import { describe, it, expect, vi, afterEach } from 'vitest'
import { createApp, createSSRApp, h, type Component } from 'vue-demi'
import { renderToString } from 'vue/server-renderer'
import VueStripeCardElement from '../src/components/VueStripeCardElement'
import VueStripeIssuingDisclosure from '../src/components/VueStripeIssuingDisclosure'
import VueStripeElements from '../src/components/VueStripeElements'
import VueStripeCheckoutElementsProvider from '../src/components/VueStripeCheckoutElementsProvider'
import VueStripeCheckoutFormProvider from '../src/components/VueStripeCheckoutFormProvider'
import VueStripeEmbeddedCheckout from '../src/components/VueStripeEmbeddedCheckout'
import VueStripePricingTable from '../src/components/VueStripePricingTable'
import { VueStripeElementsError, VueStripeProviderError } from '../src/utils/errors'
import { flushPromises } from './setup'

// #745: a component whose setup() throws for a missing wrapper keeps throwing, but when an
// app error handler (Nuxt installs one) catches it, Vue must not follow the error with
// "missing template or render function". VueStripeProvider's missing key is covered in
// tests/components/VueStripeProvider.test.ts.

const CASES: Array<[string, Component, Record<string, unknown>, typeof Error, string]> = [
  [
    'an element component (createStripeElement)',
    VueStripeCardElement,
    {},
    VueStripeElementsError,
    'VueStripeCardElement must be used within VueStripeElements or VueStripeCheckoutElementsProvider'
  ],
  [
    'a disclosure',
    VueStripeIssuingDisclosure,
    {},
    VueStripeProviderError,
    'VueStripeIssuingDisclosure needs a `stripe` prop, a VueStripeProvider ancestor or an app using createVueStripe()'
  ],
  [
    'VueStripeElements',
    VueStripeElements,
    {},
    VueStripeProviderError,
    'VueStripeElements must be used within a VueStripeProvider component or an app using createVueStripe()'
  ],
  [
    'VueStripeCheckoutElementsProvider',
    VueStripeCheckoutElementsProvider,
    { clientSecret: 'cs_test_x_secret_y' },
    VueStripeProviderError,
    'VueStripeCheckoutElementsProvider must be used within a VueStripeProvider component or an app using createVueStripe()'
  ],
  [
    'VueStripeCheckoutFormProvider',
    VueStripeCheckoutFormProvider,
    { clientSecret: 'cs_test_x_secret_y' },
    VueStripeProviderError,
    'VueStripeCheckoutFormProvider must be used within a VueStripeProvider component or an app using createVueStripe()'
  ],
  [
    'VueStripeEmbeddedCheckout',
    VueStripeEmbeddedCheckout,
    { clientSecret: 'cs_test_x_secret_y' },
    VueStripeProviderError,
    'VueStripeEmbeddedCheckout must be used within a VueStripeProvider component or an app using createVueStripe()'
  ],
  [
    'VueStripePricingTable',
    VueStripePricingTable,
    { pricingTableId: 'prctbl_test_123' },
    VueStripeProviderError,
    'VueStripePricingTable must be used within a VueStripeProvider component or an app using createVueStripe()'
  ]
]

const missingRender = (warn: ReturnType<typeof vi.spyOn>) =>
  warn.mock.calls.filter((args) => /missing template or render function/.test(args.join(' ')))

describe.each(CASES)(
  '%s without its wrapper, under an app error handler (#745)',
  (_, Comp, props, ErrorClass, message) => {
    afterEach(() => vi.restoreAllMocks())

    const expectHandled = (errorHandler: ReturnType<typeof vi.fn>) => {
      expect(errorHandler).toHaveBeenCalledTimes(1)
      const [error] = errorHandler.mock.calls[0]!
      expect(error).toBeInstanceOf(ErrorClass)
      expect((error as Error).message).toBe(message)
    }

    it('hands the throw to the handler and renders nothing, with no Vue warning', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorHandler = vi.fn()
      // createApp, not mount(): test-utils rethrows any error raised while mounting.
      const app = createApp({ render: () => h('main', [h(Comp, props)]) })
      app.config.errorHandler = errorHandler
      const root = document.createElement('div')
      app.mount(root)
      await flushPromises()

      expectHandled(errorHandler)
      expect(root.innerHTML).toBe('<main><!----></main>')
      expect(missingRender(warn)).toEqual([])
      app.unmount()
    })

    it('does the same when rendered on the server', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorHandler = vi.fn()
      const app = createSSRApp({ render: () => h('main', [h(Comp, props)]) })
      app.config.errorHandler = errorHandler
      const html = await renderToString(app)

      expectHandled(errorHandler)
      expect(html).toBe('<main><!----></main>')
      expect(missingRender(warn)).toEqual([])
    })

    it('still throws without a handler', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const app = createSSRApp({ render: () => h(Comp, props) })
      await expect(renderToString(app)).rejects.toThrow(message)
    })
  }
)
