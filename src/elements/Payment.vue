<template>
  <div>
    <form id="stripe-payment-element-form">
      <div id="stripe-payment-element-mount-point" />
      <slot name="stripe-payment-element-errors">
        <div
          id="stripe-payment-element-errors"
          role="alert"
        />
      </slot>
      <button
        ref="submitButtonRef"
        type="submit"
        class="hide"
      />
    </form>
  </div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js/dist/pure.esm.js';
// import { isSecureHost } from '../utils';
import {
  STRIPE_PARTNER_DETAILS,
  // INSECURE_HOST_ERROR_MESSAGE,
} from '../constants';
const ELEMENT_TYPE = 'payment';
export default {
  props: {
    pk: {
      type: String,
      required: true,
    },
    testMode: {
      type: Boolean,
      default: false,
    },
    elementsOptions: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    confirmParams: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    redirect: {
      type: String,
      default: 'always',
    },
    createOptions: {
      type: Object,
      default: () => ({}),
    },
    stripeAccount: {
      type: String,
      default: undefined,
    },
    apiVersion: {
      type: String,
      default: undefined,
    },
    locale: {
      type: String,
      default: 'auto',
    },
    disableAdvancedFraudDetection: {
      type: Boolean,
    },
  },
  data () {
    return {
      loading: false,
      stripe: null,
      elements: null,
      element: null,
    };
  },
  computed: {
    form () {
      return document.getElementById('stripe-payment-element-form');
    },
  },
  async mounted () {
    // FIXME: temporarily remove to avoid problems with remote non-production deployments
    // if (!isSecureHost(this.testMode)) {
    //   document.getElementById(
    //     'stripe-payment-element-mount-point',
    //   ).innerHTML = `<p style="color: red">${INSECURE_HOST_ERROR_MESSAGE}</p>`;
    //   return;
    // }

    if (this.disableAdvancedFraudDetection) {
      loadStripe.setLoadParameters({ advancedFraudSignals: false });
    }

    const stripeOptions = {
      stripeAccount: this.stripeAccount,
      apiVersion: this.apiVersion,
      locale: this.locale,
    };

    this.stripe = await loadStripe(this.pk, stripeOptions);
    this.stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);

    this.elements = this.stripe.elements(this.elementsOptions);
    this.element = this.elements.create(ELEMENT_TYPE, this.createOptions);
    this.element.mount('#stripe-payment-element-mount-point');

    this.element.on('change', event => {
      var displayError = document.getElementById(
        'stripe-payment-element-errors',
      );
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
      this.onChange(event);
    });

    this.element.on('blur', this.onBlur);
    this.element.on('click', this.onClick);
    this.element.on('escape', this.onEscape);
    this.element.on('focus', this.onFocus);
    this.element.on('ready', this.onReady);

    this.form.addEventListener('submit', async event => {
      try {
        this.$emit('loading', true);
        event.preventDefault();
        const { error, paymentIntent } = await this.stripe.confirmPayment({
          elements: this.elements,
          confirmParams: this.confirmParams,
          redirect: this.redirect,
        });

        // if the response is an error
        if (error) {
          const errorElement = document.getElementById(
            'stripe-payment-element-errors',
          );
          errorElement.textContent = error.message;
          this.$emit('error', error);
          return;
        } else if (paymentIntent) {
          // if the user has passed prop redirect="if_required"
          // and the payment confirmation was successful
          // and the payment method is not forced to redirect
          // then stripe.confirmPayment resolves with a paymentIntent
          // so we sould pass it back up to the caller for consumption
          // https://stripe.com/docs/js/payment_intents/confirm_payment?type=pii#confirm_payment_intent-options-redirect
          this.$emit('confirmed', paymentIntent);
        }
      } catch (error) {
        console.error(error);
        this.$emit('error', error);
      } finally {
        this.$emit('loading', false);
      }
    });
  },
  methods: {
    /**
     * Triggers the submission of the form
     * @return {void}
     */
    submit () {
      this.$refs.submitButtonRef.click();
    },
    /**
     * Clears the element
     * @return {void}
     */
    clear () {
      this.element.clear();
    },
    /**
     * Destroys the element
     * @return {void}
     */
    destroy () {
      this.element.destroy();
    },
    /**
     * Focuses on the element
     * @return {void}
     */
    focus () {
      console.warn(
        'This method will currently not work on iOS 13+ due to a system limitation.',
      );
      this.element.focus();
    },
    /**
     * Collapses the Payment Element into a row of payment method tabs
     * @return {void}
     */
    collapse () {
      this.element.collapse();
    },
    /**
     * Retrieves a previously created element
     */
    getElement () {
      this.element.getElement();
    },
    /**
     * Unmounts the element
     * @return {void}
     */
    unmount () {
      this.element.unmount();
    },
    /**
     * Updates the element. See official docs for more detail: https://site-admin.stripe.com/docs/js/elements_object/update_payment_element
     * @param {string} opts.business.name  Information about your business that will be displayed in the Payment Element. This information will be retrieved from the Stripe account if not provided.
     * @param {array} opts.paymentMethodOrder Sets order in which payment methods are displayed. Otherwise payment methods are ordered dynamically to optimize for conversion.
     * @param {string | Object} opts.fields.billingDetails The Payment Element automatically creates input fields to collect required billing information for some payment methods like SEPA debit. Specify 'never' to avoid collecting billing details in the Payment Element if you're collecting them outside of the Payment Element.
     * @param {string} opts.fields.billingDetails.name Specify 'never' to avoid collecting a name as part of the billing details in the Payment Element.
     * @param {string} opts.fields.billingDetails.email Specify 'never' to avoid collecting an email address as part of the billing details in the Payment Element.
     * @param {string} opts.fields.billingDetails.phone Specify 'never' to avoid collecting a phone number as part of the billing details in the Payment Element.
     * @param {string | Object} opts.fields.billingDetails.address Specify 'never' to avoid collecting an address as part of the billing details in the Payment Element.
     * @param {string} opts.fields.billingDetails.address.line1 Specify 'never' to avoid collecting an address line1 as part of the billing details in the Payment Element.
     * @param {string} opts.fields.billingDetails.address.line2 Specify 'never' to avoid collecting an address line2 as part of the billing details in the Payment Element.
     * @param {string} opts.fields.billingDetails.address.city Specify 'never' to avoid collecting an address city as part of the billing details in the Payment Element.
     * @param {string} opts.fields.billingDetails.address.state Specify 'never' to avoid collecting an address state as part of the billing details in the Payment Element.
     * @param {string} opts.fields.billingDetails.address.country Specify 'never' to avoid collecting an address country as part of the billing details in the Payment Element.
     * @param {string} opts.fields.billingDetails.address.postalCode Specify 'never' to avoid collecting an address postal code as part of the billing details in the Payment Element.
     * @param {string} opts.fields.terms The Payment Element automatically displays mandates or other legal agreements when required by the payment method, like SEPA debit. Specify 'never' to never show legal agreements.
     * @param {string} opts.fields.terms.auBecsDebit Specify 'never' to never show legal agreements for the BECS Debit payment method.
     * @param {string} opts.fields.terms.bancontact Specify 'never' to never show legal agreements for the Bancontact payment method.
     * @param {string} opts.fields.terms.card Specify 'never' to never show legal agreements for the credit card payment method.
     * @param {string} opts.fields.terms.ideal Specify 'never' to never show legal agreements for the iDEAL payment method.
     * @param {string} opts.fields.terms.sepaDebit Specify 'never' to never show legal agreements for the SEPA Debit payment method.
     * @param {string} opts.fields.terms.sofort Specify 'never' to never show legal agreements for the SOFORT payment method.
     * @param {string} opts.fields.terms.usBankAccount Specify 'never' to never show legal agreements for the US Bank accounts payment method.
     * @param {string} opts.wallets Specify 'never' to never show digital wallet payment methods like Apple Pay and Google Pay.
     * @param {string} opts.wallets.applePay Specify 'never' to never show the Apple Pay digital wallet payment method.
     * @param {string} opts.wallets.googlePay Specify 'never' to never show the Google Pay digital wallet payment method.
     */
    update (opts) {
      this.element.update(opts);
    },
    // events
    onChange (e) {
      this.$emit('element-change', e);
    },
    onReady (e) {
      this.$emit('element-ready', e);
    },
    onFocus (e) {
      this.$emit('element-focus', e);
    },
    onBlur (e) {
      this.$emit('element-blur', e);
    },
    onEscape (e) {
      this.$emit('element-escape', e);
    },
    onClick (e) {
      this.$emit('element-click', e);
    },
  },
};
</script>

<style scoped>
/**
 * The CSS shown here will not be introduced in the Quickstart guide, but shows
 * how you can use CSS to style your Element's container.
 */
.hide {
  display: none;
}
</style>
