import { createStripeDisclosure, type TreasuryDisclosureOptions } from '../utils/disclosure'

/**
 * Treasury disclosure (React Stripe.js `TreasuryDisclosure`): the legal text Stripe requires
 * for Treasury financial accounts, rendered by `stripe.createTreasuryDisclosure()`.
 * Options: `businessName`, `learnMoreLink`.
 */
export default /* @__PURE__ */ createStripeDisclosure<TreasuryDisclosureOptions>({
  componentName: 'VueStripeTreasuryDisclosure',
  method: 'createTreasuryDisclosure',
  optionKeys: ['businessName', 'learnMoreLink'],
  className: 'vue-stripe-treasury-disclosure'
})
