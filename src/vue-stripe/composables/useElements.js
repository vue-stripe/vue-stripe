import { ref } from 'vue';
import { hasElementIntent } from '../utils';

export default () => {
  // Define a reactive reference for the elements instance
  const elements = ref(null);

  // Create elements function now accepts stripe and options as arguments
  function createElements (stripe, options) {
    // Check if stripe and options are available
    if (!stripe) {
      throw new Error('Error: Stripe instance is not initiated!');
    }

    if (!hasElementIntent(options)) {
      throw new Error(
        'Error: Properties \'mode\', \'amount\', and \'currency\' are required!',
      );
    } else if (!options.clientSecret) {
      throw new Error('Error: \'clientSecret\' is required!');
    }

    // Now you can safely create elements instance
    const elementsInstance = stripe.elements(options);
    elements.value = elementsInstance;

    return elementsInstance;
  }

  // Return the reactive elements reference and createElements function
  return {
    elements,
    createElements,
  };
};
