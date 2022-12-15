export const isSecureHost = (testMode) => {
  if (testMode) return true;
  return (
    window.location.hostname === "localhost" ||
    window.location.protocol === "https:"
  );
};
