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
  confirmCardPayment: vi.fn()
}

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn(() => Promise.resolve(stripe)) }))

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
