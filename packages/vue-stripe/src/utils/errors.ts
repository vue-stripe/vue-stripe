export class VueStripeProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VueStripeProviderError'
  }
}

export class VueStripeElementsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VueStripeElementsError'
  }
}

export class VueStripeCheckoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VueStripeCheckoutError'
  }
}
