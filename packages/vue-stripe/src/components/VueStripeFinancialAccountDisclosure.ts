import { createStripeDisclosure, type FinancialAccountDisclosureOptions } from '../utils/disclosure'

/**
 * Financial Account disclosure (React Stripe.js `FinancialAccountDisclosure`): the legal
 * text Stripe requires next to Financial Accounts for platforms, rendered by
 * `stripe.createFinancialAccountDisclosure()`. Options: `businessName`, `learnMoreLink`.
 */
export default /* @__PURE__ */ createStripeDisclosure<FinancialAccountDisclosureOptions>({
  componentName: 'VueStripeFinancialAccountDisclosure',
  method: 'createFinancialAccountDisclosure',
  optionKeys: ['businessName', 'learnMoreLink'],
  className: 'vue-stripe-financial-account-disclosure'
})
