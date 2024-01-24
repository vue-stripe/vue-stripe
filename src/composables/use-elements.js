import { inject } from 'vue-demi';

export function useElements () {
  async function initializeElements (stripe, clientSecret, options) {
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