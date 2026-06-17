<script lang="ts">
import { createStripeElement } from '../utils/element-factory'

/**
 * Payment Method Messaging Element — displays promotional BNPL messaging
 * (Affirm, Klarna, Afterpay/Clearpay) for the order amount. Display-only; must
 * be used within `<VueStripeElements>`. Pass options via the `options` prop, e.g.
 * `:options="{ amount: 1099, currency: 'usd', paymentMethodTypes: ['klarna'], countryCode: 'US' }"`.
 * @see https://docs.stripe.com/js/element/payment_method_messaging_element
 */
export default createStripeElement({
  elementType: 'paymentMethodMessaging',
  componentName: 'VueStripePaymentMethodMessagingElement'
})
</script>
