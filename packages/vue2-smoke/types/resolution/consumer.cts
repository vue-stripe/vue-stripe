// Type fixture: the package's types as a CommonJS consumer (`.cts`, compiled to require())
// sees them under moduleResolution node16 and nodenext (#660). consumer.mts is the ESM twin.
// Every `@ts-expect-error` line is wrong on purpose: it stops being an error, and the
// check fails, when the export is missing or resolves to `any`.
import {
  VueStripePaymentElement,
  VueStripeProvider,
  VueStripeProviderError,
  createVueStripe,
  loadStripe,
  useStripe,
  type Stripe,
  type UseStripeReturn
} from '@vue-stripe/vue-stripe'

// @ts-expect-error an error instance is not a number
export const error: number = new VueStripeProviderError('x')
// @ts-expect-error a composable is not a number
export const composable: number = useStripe
// @ts-expect-error UseStripeReturn is an object type
export const returned: UseStripeReturn = 5
// @ts-expect-error loadStripe is a function
export const loader: number = loadStripe
// @ts-expect-error a plugin factory is not a number
export const plugin: number = createVueStripe
// @ts-expect-error a component is not a number
export const provider: number = VueStripeProvider
// @ts-expect-error a component is not a number
export const element: number = VueStripePaymentElement
// @ts-expect-error Stripe is the Stripe.js instance type
export const stripe: Stripe = 'pk_test_123'

export const loaded: Promise<Stripe | null> = loadStripe('pk_test_123')
