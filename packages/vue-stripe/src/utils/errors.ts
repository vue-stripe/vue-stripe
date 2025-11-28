export class StripeProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeProviderError';
  }
}

export class StripeElementsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeElementsError';
  }
}

export class StripeLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeLoadError';
  }
}

export function createError(type: 'provider' | 'elements' | 'load', message: string): Error {
  switch (type) {
    case 'provider':
      return new StripeProviderError(message);
    case 'elements':
      return new StripeElementsError(message);
    case 'load':
      return new StripeLoadError(message);
    default:
      return new Error(message);
  }
}