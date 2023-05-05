import { ref } from 'vue';
import { hasElementIntent } from '../utilities';
export const useElements = () => {
  const elements = ref(null);

  function createElements (stripe, options) {
    if (!stripe?.value) {
      throw new Error('Error: Stripe instance is not initiated!');
    }

    if (!hasElementIntent(options)) {
      throw new Error('Error: Properties \'mode\', \'amount\', and \'currency\' is required!');
    } else if (!options.clientSecret) {
      throw new Error('Error: \'clientsSecret\' is required!');
    }

    const elementsInstance = stripe.elements(options);
    elements.value = elementsInstance;
    return elementsInstance;
  }

  return {
    elements,
    createElements,
  };
};
