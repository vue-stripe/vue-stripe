import { inject } from 'vue-demi';

export function useElements () {
  const stripe = inject('stripe-instance');
  async function initializeElements (clientSecret, options) {
    const elements = stripe.elements({
      ...options,
      clientSecret,
    });
    return elements;
  }

  return {
    initializeElements,
  };
};