import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import StripeProviderView from './views/StripeProviderView.vue'
import StripeElementsView from './views/StripeElementsView.vue'
import UseStripeView from './views/UseStripeView.vue'
import CardElementView from './views/CardElementView.vue'
import SplitCardView from './views/SplitCardView.vue'
import PaymentElementView from './views/PaymentElementView.vue'
import AddressElementView from './views/AddressElementView.vue'
import LinkAuthenticationView from './views/LinkAuthenticationView.vue'
import ExpressCheckoutView from './views/ExpressCheckoutView.vue'
import SetupIntentView from './views/SetupIntentView.vue'
import CheckoutView from './views/CheckoutView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/stripe-provider',
      name: 'StripeProvider',
      component: StripeProviderView
    },
    {
      path: '/use-stripe',
      name: 'useStripe',
      component: UseStripeView
    },
    {
      path: '/stripe-elements',
      name: 'StripeElements',
      component: StripeElementsView
    },
    {
      path: '/stripe-card-element',
      name: 'StripeCardElement',
      component: CardElementView
    },
    {
      path: '/stripe-split-card',
      name: 'SplitCardElements',
      component: SplitCardView
    },
    {
      path: '/stripe-payment-element',
      name: 'StripePaymentElement',
      component: PaymentElementView
    },
    {
      path: '/stripe-address-element',
      name: 'StripeAddressElement',
      component: AddressElementView
    },
    {
      path: '/stripe-link-authentication',
      name: 'StripeLinkAuthenticationElement',
      component: LinkAuthenticationView
    },
    {
      path: '/stripe-express-checkout',
      name: 'StripeExpressCheckoutElement',
      component: ExpressCheckoutView
    },
    {
      path: '/use-setup-intent',
      name: 'useSetupIntent',
      component: SetupIntentView
    },
    {
      path: '/stripe-checkout',
      name: 'StripeCheckout',
      component: CheckoutView
    }
    // Routes will be added as we test each component
  ]
})

export default router
