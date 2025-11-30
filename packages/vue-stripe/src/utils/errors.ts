export class VueStripeProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VueStripeProviderError';
  }
}

export class VueStripeElementsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VueStripeElementsError';
  }
}

export class VueStripeLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VueStripeLoadError';
  }
}

export function createVueStripeError(type: 'provider' | 'elements' | 'load', message: string): Error {
  switch (type) {
    case 'provider':
      return new VueStripeProviderError(message);
    case 'elements':
      return new VueStripeElementsError(message);
    case 'load':
      return new VueStripeLoadError(message);
    default:
      return new Error(message);
  }
}
