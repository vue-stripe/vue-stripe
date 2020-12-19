import {
  SUPPORTED_LANGS,
  SUPPORTED_SUBMIT_TYPES,
  BILLING_ADDRESS_COLLECTION_TYPES
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
    default: 'auto',
    validator: value => SUPPORTED_LANGS.includes(value),
  },
  shippingAddressCollection: {
    type: Object,
    validator: value => value.hasOwnProperty('allowedCountries'),
  },
};
