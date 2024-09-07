// Constants for Stripe integration
import pkg from '../../package.json';

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

export const DEFAULT_LOCALE = 'auto';

export const SUPPORTED_LOCALES = [
  'ar',
  'auto',
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'en-GB',
  'en',
  'es-419',
  'es',
  'et',
  'fi',
  'fil',
  'fr-CA',
  'fr',
  'he',
  'hr',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'lt',
  'lv',
  'ms',
  'mt',
  'nb',
  'nl',
  'pl',
  'pt-BR',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'th',
  'tr',
  'tr',
  'vi',
  'zh-HK',
  'zh-TW',
  'zh',
];

export const SUPPORTED_SUBMIT_TYPES = ['auto', 'book', 'donate', 'pay'];

export const BILLING_ADDRESS_COLLECTION_TYPES = ['required', 'auto'];

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
    },
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a',
  },
};

export const VUE_STRIPE_VERSION = pkg.version;

export const STRIPE_PARTNER_DETAILS = {
  name: 'vue-stripe',
  version: VUE_STRIPE_VERSION,
  url: 'https://vuestripe.com',
  partner_id: 'pp_partner_IqtOXpBSuz0IE2',
};

export const INSECURE_HOST_ERROR_MESSAGE = 'Vue Stripe will not work on an insecure host. Make sure that your site is using TCP/SSL.';

export const PAYMENT_ELEMENT_TYPE = 'payment';
export const LINK_AUTHENTICATION_ELEMENT_TYPE = 'linkAuthentication';
export const EXPRESS_CHECKOUT_ELEMENT_TYPE = 'expressCheckout';
export const ADDRESS_ELEMENT_TYPE = 'address';

export const ISSUING_CARD_NUMBER_DISPLAY_ELEMENT_TYPE = 'issuingCardNumberDisplay';
export const ISSUING_CARD_CVC_DISPLAY_ELEMENT_TYPE = 'issuingCardCvcDisplay';
export const ISSUING_CARD_EXPIRY_DISPLAY_ELEMENT_TYPE = 'issuingCardExpiryDisplay';
export const ISSUING_CARD_PIN_DISPLAY_ELEMENT_TYPE = 'issuingCardPinDisplay';
export const ISSUING_CARD_COPY_BUTTON_ELEMENT_TYPE = 'issuingCardCopyButton';
