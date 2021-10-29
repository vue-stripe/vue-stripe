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
  tokenData: any;
  disableAdvancedFraudDetection: boolean;
  classes: any;
  elementStyle: any;
  value?: string;
  hidePostalCode: boolean;
}
