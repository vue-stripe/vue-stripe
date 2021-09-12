import Vue, { PluginObject, PluginFunction } from "vue";

export type StripePluginOptions = {
  pk: string;
  stripeAccount: string;
  apiVersion: string;
  locale: string;
}

export interface StripePluginObject extends PluginObject<StripePluginOptions> {
  install: PluginFunction<StripePluginOptions>;
}

export declare const StripePlugin: StripePluginObject;

export class StripeCheckout extends Vue {
  pk: string;
  mode?: string;
  lineItems: Array<any> | null;
  items: Array<any> | null;
  successUrl: string;
  cancelUrl: string;
  submitType?: string;
  billingAddressCollection: string;
  clientReferenceId: string;
  customerEmail?: string;
  sessionId?: string;
  locale: string;
  shippingAddressCollection?: any;
  disableAdvancedFarudDetection: boolean;

  redirectToCheckout(): void;
}

export type StripeElementsPluginOptions = {
  pk: string;
  stripeAccount: string;
  apiVersion: string;
  locale: string;
  elementsOptions: any;
}

export interface StripeElementsPluginObject extends PluginObject<StripeElementsPluginOptions> {
  install: PluginFunction<StripeElementsPluginOptions>;
}

export declare const StripeElementsPlugin: StripePluginObject;

export class StripeElementCard extends Vue {
  pk: string;
  stripeAccount: string;
  apiVersion: string;
  locale: string;
  elementsOptions: any;
  disableAdvancedFraudDetection: boolean;
  classes: any;
  elementStyle: any;
  value?: string;
  hidePostalCode: boolean;

  submit(): void;
}

export interface StripePaymentToken {
  client_ip: string;
  created: number;
  id: string;
  livemode: boolean;
  object: string;
  type: StripeTokenType;
  used: boolean;
  card?: StripeCard;
}

export interface StripeCard {
  address_city: string | null;
  address_country: string | null;
  address_line1: string | null;
  address_line1_check: StripeAddressLineCheck;
  address_line2: string | null;
  address_state: string | null;
  address_zip: string;
  address_zip_check: StripeAddressCheck;
  brand: StripeCardBrand;
  country: string;
  cvc_check: StripeAddressCheck;
  dynamic_last4: string | null;
  exp_month: number;
  exp_year: number;
  funding: StripeCardFundingType;
  id: string;
  last4: string;
  name: string | null;
  object: string;
  tokenization_method: StripeTokenizationMethod;
}

export type StripeAccountHolder = 'individual' | 'company';
export type StripeCardBrand = 'American Express' | 'Diners Club' | 'Discover' | 'JCB' | 'MasterCard' | 'UnionPay' | 'Visa' | 'Unknown';
export type StripeCardFundingType = 'credit' | 'debit' | 'prepaid' | 'unknown';
export type StripeTokenizationMethod = 'android_pay' | 'apple_pay' | 'masterpass' | 'visa_checkout' | null;
export type StripeAddressCheck = 'pass' | 'fail' | 'unchecked' | 'unavailable' | null;
export type StripeTokenType = 'account' | 'bank_account' | 'card' | 'pii';
