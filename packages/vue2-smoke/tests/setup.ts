import { vi } from 'vitest'

export const element = {
  mount: vi.fn(),
  unmount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  update: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn()
}
export const elements = {
  create: vi.fn(() => element),
  submit: vi.fn(),
  update: vi.fn(() => Promise.resolve())
}
export const stripe = {
  elements: vi.fn(() => elements),
  registerAppInfo: vi.fn(),
  initCheckoutElementsSdk: vi.fn(),
  confirmCardPayment: vi.fn(),
  createConfirmationToken: vi.fn()
}

// The library loads Stripe.js through the side-effect-free pure entry only.
vi.mock('@stripe/stripe-js/pure', () => ({
  loadStripe: Object.assign(
    vi.fn(() => Promise.resolve(stripe)),
    { setLoadParameters: vi.fn() }
  )
}))

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
