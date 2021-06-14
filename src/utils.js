export const isSecureHost = () => {
  return window.location.hostname === 'localhost' || window.location.protocol === 'https:';
};
