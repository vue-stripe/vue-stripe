import { createStripeDisclosure, type IssuingDisclosureOptions } from '../utils/disclosure'

/**
 * Issuing disclosure (React Stripe.js `IssuingDisclosure`): the legal text Stripe requires
 * for an Issuing card program, rendered by `stripe.createIssuingDisclosure()`.
 * Options: `issuingProgramID`, `publicCardProgramName`, `learnMoreLink`.
 */
export default /* @__PURE__ */ createStripeDisclosure<IssuingDisclosureOptions>({
  componentName: 'VueStripeIssuingDisclosure',
  method: 'createIssuingDisclosure',
  optionKeys: ['issuingProgramID', 'publicCardProgramName', 'learnMoreLink'],
  className: 'vue-stripe-issuing-disclosure'
})
