import { ref } from 'vue';
export const useElements = () => {
  const elements = ref(null);

  function createElements (stripe, options) {
    return stripe.elements(options);
  }

  return {
    elements,
    createElements,
  };
};
