export const STRIPE_JS_SDK_URL = 'https://js.stripe.com';

export const SUPPORTED_ELEMENT_TYPE = [
  'card',
  'cardNumber',
  'cardExpiry',
  'cardCvc',
  'fpxBank',
  'iban',
  'idealBank',
  'p24Bank',
  'epsBank',
  'paymentRequestButton',
  'auBankAccount',
];

export const SUPPORTED_LANGS = [
  'auto',
  'da',
  'de',
  'en',
  'es',
  'es-419',
  'fi',
  'fr',
  'it',
  'ja',
  'nb',
  'nl',
  'pl',
  'pt',
  'sv',
  'zh',
];

export const SUPPORTED_SUBMIT_TYPES = [
  'auto',
  'book',
  'donate',
  'pay',
];

export const BILLING_ADDRESS_COLLECTION_TYPES = [
  'required',
  'auto',
];

export const SHIPPING_ADDRESS_COLLECTION_UNSUPPORTED_COUNTRIES = [
  'AS',
  'CX',
  'CC',
  'CU',
  'HM',
  'IR',
  'KP',
  'MH',
  'FM',
  'NF',
  'MP',
  'PW',
  'SD',
  'SY',
  'UM',
  'VI',
];

export const DEFAULT_ELEMENT_STYLE = {
  base: {
    color: '#32325d',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4',
    }
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a',
  },
};