// Check if the current host is secure, considering test mode.
export const isSecureHost = (testMode) => {
  // In test mode, we assume the host is secure.
  if (testMode) {
    return true;
  }

  // Otherwise, check if the host is localhost or using the HTTPS protocol.
  return window.location.hostname === 'localhost' || window.location.protocol === 'https:';
};

// Check if the options have intent by ensuring all required properties are present.
export const hasElementIntent = (options) => {
  // Check if all the required properties (mode, currency, and amount) are truthy.
  // Using the !! operator to explicitly convert values to booleans.
  return !!options.mode && !!options.currency && !!options.amount;
};
