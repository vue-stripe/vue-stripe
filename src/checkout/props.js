import {
  BILLING_ADDRESS_COLLECTION_TYPES,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  SUPPORTED_SUBMIT_TYPES,
} from '../constants';

export default {
  pk: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    validator: value => ['payment', 'subscription'].includes(value),
  },
  lineItems: {
    type: Array,
    default: null,
  },
  items: {
    type: Array,
  },
  successUrl: {
    type: String,
    default: window.location.href,
  },
  cancelUrl: {
    type: String,
    default: window.location.href,
  },
  submitType: {
    type: String,
    validator: (value) => SUPPORTED_SUBMIT_TYPES.includes(value),
  },
  billingAddressCollection: {
    type: String,
    default: 'auto',
    validator: (value) => BILLING_ADDRESS_COLLECTION_TYPES.includes(value),
  },
  clientReferenceId: {
    type: String,
  },
  customerEmail: {
    type: String,
  },
  sessionId: {
    type: String,
  },
  locale: {
    type: String,
    default: DEFAULT_LOCALE,
    coerce: (locale) => {
      if (SUPPORTED_LOCALES.includes(locale)) return locale;
      console.warn(`VueStripe Warning: '${locale}' is not supported by Stripe yet. Falling back to default '${DEFAULT_LOCALE}'.`);
      return DEFAULT_LOCALE;
    },
  },
  shippingAddressCollection: {
    type: Object,
    validator: value => Object.prototype.hasOwnProperty.call(value, 'allowedCountries'),
  },
  disableAdvancedFraudDetection: {
    type: Boolean,
  },
};
