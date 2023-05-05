export const isSecureHost = (testMode) => {
  if (testMode) return true;
  return window.location.hostname === 'localhost' || window.location.protocol === 'https:';
};

export const hasElementIntent = (options) => {
  return options.mode && options.currency && options.amount;
};
