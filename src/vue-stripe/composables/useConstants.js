// useConstants.js
import { ref } from 'vue';
import * as constants from '../constants'; // Import all constants from ../constants

export default () => {
  // Create a ref to make the constants reactive
  const constantsRef = ref(constants);

  // Return the ref to the constants
  return {
    constants: constantsRef,
  };
};
