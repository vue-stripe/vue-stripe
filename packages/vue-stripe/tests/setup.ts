import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { isVue2 } from 'vue-demi'

// Mock Stripe.js
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        unmount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        update: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
        clear: vi.fn()
      }))
    })),
    confirmPayment: vi.fn(() => Promise.resolve({
      paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
    })),
    confirmCardSetup: vi.fn(() => Promise.resolve({
      setupIntent: { id: 'seti_test_123', status: 'succeeded' }
    }))
  }))
}))

// Configure Vue Test Utils
if (isVue2) {
  // Vue 2 specific setup
  config.global.stubs = {}
} else {
  // Vue 3 specific setup
  config.global.stubs = {}
}

// Global test utilities
export const createMockStripe = () => ({
  elements: vi.fn(() => ({
    create: vi.fn(() => ({
      mount: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      update: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      clear: vi.fn()
    }))
  })),
  confirmPayment: vi.fn(),
  confirmCardSetup: vi.fn()
})

export const createMockElement = () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  update: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn(),
  // Address element specific
  getValue: vi.fn(() => Promise.resolve({
    complete: true,
    isNewAddress: true,
    value: {
      name: 'John Doe',
      address: {
        line1: '123 Main St',
        line2: null,
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94102',
        country: 'US'
      }
    }
  }))
})

export const waitForStripeLoad = () => new Promise(resolve => setTimeout(resolve, 100))

// Flush all pending promises - useful for waiting on async operations
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))