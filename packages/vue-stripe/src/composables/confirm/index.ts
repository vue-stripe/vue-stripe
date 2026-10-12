import { createStripeMethodComposable } from '../../utils/method-factory'

// One composable per method-specific Stripe.js confirmer (`stripe.confirm<Method>Payment` /
// `stripe.confirm<Method>Setup`), each returning `{ confirm<Method>..., loading, error }`.
// tests/composables/confirm.test.ts fails when Stripe.js declares a confirmer missing here.
// Each call is pure so unused composables are tree-shaken.

export const useConfirmAcssDebitPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmAcssDebitPayment')
export const useConfirmAcssDebitSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmAcssDebitSetup')
export const useConfirmAffirmPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmAffirmPayment')
export const useConfirmAfterpayClearpayPayment = /* @__PURE__ */ createStripeMethodComposable(
  'confirmAfterpayClearpayPayment'
)
export const useConfirmAlipayPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmAlipayPayment')
export const useConfirmAmazonPaySetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmAmazonPaySetup')
export const useConfirmAuBecsDebitPayment = /* @__PURE__ */ createStripeMethodComposable(
  'confirmAuBecsDebitPayment'
)
export const useConfirmAuBecsDebitSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmAuBecsDebitSetup')
export const useConfirmBacsDebitSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmBacsDebitSetup')
export const useConfirmBancontactPayment = /* @__PURE__ */ createStripeMethodComposable(
  'confirmBancontactPayment'
)
export const useConfirmBancontactSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmBancontactSetup')
export const useConfirmBilliePayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmBilliePayment')
export const useConfirmBlikPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmBlikPayment')
export const useConfirmBlikSetup = /* @__PURE__ */ createStripeMethodComposable('confirmBlikSetup')
export const useConfirmBoletoPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmBoletoPayment')
export const useConfirmCardPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmCardPayment')
export const useConfirmCardSetup = /* @__PURE__ */ createStripeMethodComposable('confirmCardSetup')
export const useConfirmCashappPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmCashappPayment')
export const useConfirmCashappSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmCashappSetup')
export const useConfirmCustomerBalancePayment = /* @__PURE__ */ createStripeMethodComposable(
  'confirmCustomerBalancePayment'
)
export const useConfirmEpsPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmEpsPayment')
export const useConfirmFpxPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmFpxPayment')
export const useConfirmGiropayPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmGiropayPayment')
export const useConfirmGrabPayPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmGrabPayPayment')
export const useConfirmIdealPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmIdealPayment')
export const useConfirmIdealSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmIdealSetup')
export const useConfirmKlarnaPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmKlarnaPayment')
export const useConfirmKonbiniPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmKonbiniPayment')
export const useConfirmMobilepayPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmMobilepayPayment')
export const useConfirmMultibancoPayment = /* @__PURE__ */ createStripeMethodComposable(
  'confirmMultibancoPayment'
)
export const useConfirmOxxoPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmOxxoPayment')
export const useConfirmP24Payment =
  /* @__PURE__ */ createStripeMethodComposable('confirmP24Payment')
export const useConfirmPayByBankPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmPayByBankPayment')
export const useConfirmPayNowPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmPayNowPayment')
export const useConfirmPayPalPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmPayPalPayment')
export const useConfirmPayPalSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmPayPalSetup')
export const useConfirmPixPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmPixPayment')
export const useConfirmPromptPayPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmPromptPayPayment')
export const useConfirmSepaDebitPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmSepaDebitPayment')
export const useConfirmSepaDebitSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmSepaDebitSetup')
export const useConfirmSofortPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmSofortPayment')
export const useConfirmSofortSetup =
  /* @__PURE__ */ createStripeMethodComposable('confirmSofortSetup')
export const useConfirmTwintPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmTwintPayment')
export const useConfirmUsBankAccountPayment = /* @__PURE__ */ createStripeMethodComposable(
  'confirmUsBankAccountPayment'
)
export const useConfirmUsBankAccountSetup = /* @__PURE__ */ createStripeMethodComposable(
  'confirmUsBankAccountSetup'
)
export const useConfirmWechatPayPayment =
  /* @__PURE__ */ createStripeMethodComposable('confirmWechatPayPayment')
